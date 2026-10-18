import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { startVitest } from 'vitest/node';

const { PLUGINS } = vi.hoisted(() => ({ PLUGINS: [{ name: 'babel' }, { name: 'xaendar' }] }));

vi.mock('../../utils/plugins', () => ({
  createPlugins: () => PLUGINS
}));

import { testCommand } from './test.command';

/**
 * Builds a fake `startVitest`, resolving to a Vitest instance that keeps running or not.
 *
 * @param keepServer - Whether Vitest runs in watch mode.
 * @returns The fake and the `exit` method of the instance it resolves to.
 */
function createVitest(keepServer: boolean) {
  const exit = vi.fn().mockResolvedValue(undefined);
  const runVitest = vi.fn().mockResolvedValue({ shouldKeepServer: () => keepServer, exit });

  return { runVitest: runVitest as unknown as typeof startVitest, exit };
}

/**
 * The members of the setup plugin the specs call.
 */
type SetupPlugin = {
  resolveId: (id: string) => string | undefined;
  load: (id: string) => string | undefined;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('testCommand()', () => {
  it('registers the "test" command with its "t" alias', () => {
    const command = testCommand();

    expect(command.name()).toBe('test');
    expect(command.aliases()).toContain('t');
  });

  it('runs Vitest with the shared plugins, in a DOM environment installing the signals first, and exits after a single run', async () => {
    const { runVitest, exit } = createVitest(false);

    await testCommand(runVitest).parseAsync([], { from: 'user' });

    expect(runVitest).toHaveBeenCalledWith(
      [],
      { environment: 'happy-dom', setupFiles: ['virtual:xaendar-signals-setup'] },
      { plugins: [expect.objectContaining({ name: 'xaendar:signals-setup' }), ...PLUGINS] }
    );
    expect(exit).toHaveBeenCalledOnce();
  });

  it('provides the setup module calling loadSignals() as a virtual module', async () => {
    const { runVitest } = createVitest(false);

    await testCommand(runVitest).parseAsync([], { from: 'user' });

    const { plugins } = vi.mocked(runVitest).mock.calls[0]![2] as unknown as { plugins: SetupPlugin[] };
    const [setupPlugin] = plugins;

    expect(setupPlugin!.resolveId('/project/src/virtual:xaendar-signals-setup')).toBe('\0virtual:xaendar-signals-setup');
    expect(setupPlugin!.resolveId('./other')).toBeUndefined();
    expect(setupPlugin!.load('\0virtual:xaendar-signals-setup')).toContain('loadSignals();');
    expect(setupPlugin!.load('./other')).toBeUndefined();
  });

  it('keeps Vitest running in watch mode', async () => {
    const { runVitest, exit } = createVitest(true);

    await testCommand(runVitest).parseAsync([], { from: 'user' });

    expect(exit).not.toHaveBeenCalled();
  });
});
