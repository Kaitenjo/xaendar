import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { startVitest } from 'vitest/node';

vi.mock('../../utils/plugins', () => ({
  PLUGINS: [{ name: 'babel' }, { name: 'xaendar' }]
}));

import { PLUGINS } from '../../utils/plugins';
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

    expect(runVitest).toHaveBeenCalledWith([], { environment: 'happy-dom', setupFiles: ['./signals.ts'] }, { plugins: PLUGINS });
    expect(exit).toHaveBeenCalledOnce();
  });

  it('keeps Vitest running in watch mode', async () => {
    const { runVitest, exit } = createVitest(true);

    await testCommand(runVitest).parseAsync([], { from: 'user' });

    expect(exit).not.toHaveBeenCalled();
  });
});
