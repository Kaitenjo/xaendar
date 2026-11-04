import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';

vi.mock('@xaendar/language-core', () => ({
  getLanguageService: vi.fn()
}));

vi.mock('../../utils/type-check/type-check.utils', () => ({
  collectProjectDiagnostics: vi.fn(),
  formatTypeDiagnostics: vi.fn()
}));

import { getLanguageService } from '@xaendar/language-core';
import type { PluginContext } from 'rolldown';
import { CLIENT_STRATEGY, SERVER_STRATEGY } from '../../costants/plugin-strategies';
import { collectProjectDiagnostics, formatTypeDiagnostics } from '../../utils/type-check/type-check.utils';
import { createBuildEndHook } from './build-end';

/**
 * Language service returned by the mocked `getLanguageService`.
 */
const LANGUAGE_SERVICE = {} as ReturnType<typeof getLanguageService>;

/**
 * Builds a plugin state for a test to assert on.
 *
 * @param isBuild - Whether the plugin runs in a build.
 * @returns The mocked plugin state.
 */
function createState(isBuild: boolean): XaendarPluginState {
  return {
    compilerOptions: { strict: true },
    projectFileNames: ['/project/src/main.ts'],
    isBuild,
    logError: vi.fn(),
    strategies: { client: CLIENT_STRATEGY, server: SERVER_STRATEGY }
  } as unknown as XaendarPluginState;
}

/**
 * Builds a mocked `buildEnd` hook plugin context, whose `error` throws as Vite's does.
 *
 * @param consumer - The consumer of the environment, the browser by default.
 * @returns The mocked plugin context.
 */
function createPluginContext(consumer: 'client' | 'server' = 'client'): PluginContext {
  return {
    error: vi.fn((message: string) => { throw new Error(message); }),
    environment: { config: { consumer } }
  } as unknown as PluginContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getLanguageService).mockReturnValue(LANGUAGE_SERVICE);
  vi.mocked(collectProjectDiagnostics).mockReturnValue([]);
});

describe('createBuildEndHook()', () => {
  it('type-checks the whole program of the project in a build', () => {
    const state = createState(true);
    const ctx = createPluginContext();

    createBuildEndHook(state).call(ctx);

    expect(getLanguageService).toHaveBeenCalledWith(state.compilerOptions, state.projectFileNames);
    expect(collectProjectDiagnostics).toHaveBeenCalledWith(LANGUAGE_SERVICE);
    expect(state.logError).not.toHaveBeenCalled();
    expect(ctx.error).not.toHaveBeenCalled();
  });

  it('logs the type errors and fails the build', () => {
    vi.mocked(collectProjectDiagnostics).mockReturnValue(['first', 'second'] as unknown as ReturnType<typeof collectProjectDiagnostics>);
    vi.mocked(formatTypeDiagnostics).mockReturnValue('main.ts(1,7): error TS2322');
    const state = createState(true);

    expect(() => createBuildEndHook(state).call(createPluginContext())).toThrow('Type check failed - 2 error(s)');
    expect(formatTypeDiagnostics).toHaveBeenCalledWith(['first', 'second']);
    expect(state.logError).toHaveBeenCalledWith('', '[TypeChecker] Type check failed\nmain.ts(1,7): error TS2322');
  });

  it('does not type-check in the dev server, nor a build that already failed', () => {
    createBuildEndHook(createState(false)).call(createPluginContext());
    createBuildEndHook(createState(true)).call(createPluginContext(), new Error('boom'));

    expect(collectProjectDiagnostics).not.toHaveBeenCalled();
  });

  it('does not type-check the build of the server, checked by the one of the browser', () => {
    createBuildEndHook(createState(true)).call(createPluginContext('server'));

    expect(collectProjectDiagnostics).not.toHaveBeenCalled();
  });
});
