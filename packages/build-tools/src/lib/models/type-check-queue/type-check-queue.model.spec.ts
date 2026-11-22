import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';

vi.mock('@xaendar/language-core', () => ({
  getLanguageService: vi.fn()
}));

vi.mock('../../registry/dependency-registry/dependency-registry', () => ({
  registerDependency: vi.fn()
}));

vi.mock('../../utils/project-dependencies/project-dependencies.utils', () => ({
  collectProjectDependencies: vi.fn(() => [])
}));

vi.mock('../../utils/template-type-check/template-type-check.utils', () => ({
  reportTemplateDiagnostics: vi.fn()
}));

vi.mock('../../utils/type-check/type-check.utils', () => ({
  collectFileDiagnostics: vi.fn(() => []),
  formatTypeDiagnostics: vi.fn(() => 'formatted')
}));

import { getLanguageService } from '@xaendar/language-core';
import { registerDependency } from '../../registry/dependency-registry/dependency-registry';
import type { TemplateTypeCheck } from '../../types/template-type-check.type';
import { collectProjectDependencies } from '../../utils/project-dependencies/project-dependencies.utils';
import { reportTemplateDiagnostics } from '../../utils/template-type-check/template-type-check.utils';
import { collectFileDiagnostics, formatTypeDiagnostics } from '../../utils/type-check/type-check.utils';
import { TypeCheckQueue } from './type-check-queue.model';

/**
 * The program of the mocked language service.
 */
const PROGRAM = { program: true };

/**
 * The mocked language service.
 */
const LANGUAGE_SERVICE = { getProgram: () => PROGRAM } as unknown as ReturnType<typeof getLanguageService>;

/**
 * Builds the plugin state of a dev server, whose logger, watcher and channel to the browser are mocked.
 *
 * @param server - Whether the state holds a dev server.
 * @returns The state.
 */
function createState(server = true): XaendarPluginState {
  return {
    compilerOptions: { strict: true },
    projectFileNames: ['/src/main.ts'],
    logError: vi.fn(),
    server: server ? {
      config: { logger: { warn: vi.fn() } },
      watcher: { add: vi.fn() },
      environments: { client: { hot: { send: vi.fn() } } }
    } : undefined
  } as unknown as XaendarPluginState;
}

/**
 * Builds the type-check of the template of a component.
 *
 * @param componentPath - The path of the component.
 * @param shimPath - The path of its shim.
 * @returns The type-check.
 */
const check = (componentPath: string, shimPath = `${componentPath}.__typecheck__.ts`) => ({ componentPath, shimPath }) as TemplateTypeCheck;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(getLanguageService).mockReturnValue(LANGUAGE_SERVICE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TypeCheckQueue', () => {
  it('checks the files and the templates queued together, once the files served pause, on the language service of the project', () => {
    const state = createState();
    const queue = new TypeCheckQueue(state);
    queue.queueTemplate(check('/src/a.ts'));
    queue.queueFile('/src/util.ts');
    vi.advanceTimersByTime(60);
    queue.queueTemplate(check('/src/b.ts'));

    vi.advanceTimersByTime(299);
    expect(getLanguageService).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(getLanguageService).toHaveBeenCalledOnce();
    expect(getLanguageService).toHaveBeenCalledWith(state.compilerOptions, state.projectFileNames);
    expect(collectFileDiagnostics).toHaveBeenCalledWith(LANGUAGE_SERVICE, '/src/util.ts');
    expect(vi.mocked(reportTemplateDiagnostics).mock.calls.map(([, , , templateCheck]) => templateCheck.componentPath)).toEqual(['/src/a.ts', '/src/b.ts']);
  });

  it('checks the template of a component served again once, with its last check', () => {
    const queue = new TypeCheckQueue(createState());
    queue.queueTemplate(check('/src/a.ts', '/old.ts'));
    queue.queueTemplate(check('/src/a.ts', '/new.ts'));

    vi.runAllTimers();

    expect(reportTemplateDiagnostics).toHaveBeenCalledOnce();
    expect(vi.mocked(reportTemplateDiagnostics).mock.calls[0][3].shimPath).toBe('/new.ts');
  });

  it('checks five seconds later at most while files keep being served', () => {
    const queue = new TypeCheckQueue(createState());
    for (let i = 0; i < 100; i++) {
      queue.queueFile(`/src/file-${i}.ts`);
      vi.advanceTimersByTime(60);
    }

    // The files queued in the first five seconds, from 0 to 4980 ms
    expect(getLanguageService).toHaveBeenCalledOnce();
    expect(collectFileDiagnostics).toHaveBeenCalledTimes(84);
  });

  it('logs the errors of the files and of the templates, showing them all in the overlay of Vite', () => {
    const state = createState();
    vi.mocked(collectFileDiagnostics).mockReturnValueOnce(['diagnostic'] as never);
    vi.mocked(reportTemplateDiagnostics).mockReturnValueOnce(['template error']);
    const queue = new TypeCheckQueue(state);
    queue.queueFile('/src/util.ts');
    queue.queueTemplate(check('/src/a.ts'));

    vi.runAllTimers();

    expect(formatTypeDiagnostics).toHaveBeenCalledWith(['diagnostic']);
    expect(state.logError).toHaveBeenCalledWith('', '[TypeChecker] Type check failed\nformatted');
    expect(state.server!.environments.client.hot.send).toHaveBeenCalledWith({
      type: 'error',
      err: { message: '[TypeChecker] Type check failed\nformatted\n\ntemplate error', stack: '', plugin: 'xaendar' }
    });
  });

  it('shows nothing in the overlay without errors, and warns through the logger of the dev server', () => {
    const state = createState();
    const queue = new TypeCheckQueue(state);
    queue.queueTemplate(check('/src/a.ts'));

    vi.runAllTimers();
    vi.mocked(reportTemplateDiagnostics).mock.calls[0][0]('an event');

    expect(state.server!.config.logger.warn).toHaveBeenCalledWith('[plugin xaendar] an event');
    expect(state.server!.environments.client.hot.send).not.toHaveBeenCalled();
  });

  it('watches and registers the files each template depends on, its component excluded', () => {
    const state = createState();
    vi.mocked(collectProjectDependencies).mockReturnValueOnce(['/src/a.ts', '/src/value.type.ts']);
    const queue = new TypeCheckQueue(state);
    queue.queueTemplate(check('/src/a.ts'));

    vi.runAllTimers();

    expect(collectProjectDependencies).toHaveBeenCalledWith(PROGRAM, '/src/a.ts.__typecheck__.ts', state.compilerOptions);
    expect(state.server!.watcher.add).toHaveBeenCalledExactlyOnceWith('/src/value.type.ts');
    expect(registerDependency).toHaveBeenCalledExactlyOnceWith('/src/value.type.ts', '/src/a.ts');
  });

  it('reports to the console without a dev server', () => {
    const state = createState(false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(collectProjectDependencies).mockReturnValueOnce(['/src/value.type.ts']);
    vi.mocked(reportTemplateDiagnostics).mockReturnValueOnce(['template error']);
    const queue = new TypeCheckQueue(state);
    queue.queueTemplate(check('/src/a.ts'));

    vi.runAllTimers();
    vi.mocked(reportTemplateDiagnostics).mock.calls[0][0]('an event');

    expect(warn).toHaveBeenCalledWith('[plugin xaendar] an event');
    expect(registerDependency).toHaveBeenCalledWith('/src/value.type.ts', '/src/a.ts');
    warn.mockRestore();
  });

  it('logs an error of the type-check itself, never throwing it', () => {
    const state = createState();
    const error = new Error('boom');
    vi.mocked(getLanguageService).mockImplementation(() => {
      throw error;
    });
    const queue = new TypeCheckQueue(state);
    queue.queueFile('/src/util.ts');

    expect(() => vi.runAllTimers()).not.toThrow();
    expect(state.logError).toHaveBeenCalledWith(error, 'Failed to type-check');
  });

  it('drops the checks queued once cancelled, and checks nothing without checks queued', () => {
    const queue = new TypeCheckQueue(createState());
    queue.queueFile('/src/util.ts');
    queue.cancel();
    vi.runAllTimers();
    queue.run();

    expect(collectFileDiagnostics).not.toHaveBeenCalled();
    expect(reportTemplateDiagnostics).not.toHaveBeenCalled();
  });
});
