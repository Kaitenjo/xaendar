import { createServer } from 'vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vite', () => ({
  createServer: vi.fn()
}));

vi.mock('../../utils/plugins', () => ({
  PLUGINS: [{ name: 'babel' }, { name: 'xaendar' }]
}));

import { PLUGINS } from '../../utils/plugins';
import { startCommand } from './start.command';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('startCommand()', () => {
  it('registers the "start" command with its "s" alias', () => {
    const command = startCommand();

    expect(command.name()).toBe('start');
    expect(command.aliases()).toContain('s');
  });

  it('creates and starts a vite dev server with the shared plugins', async () => {
    const listen = vi.fn().mockResolvedValue(undefined);
    vi.mocked(createServer).mockResolvedValue({ listen } as unknown as Awaited<ReturnType<typeof createServer>>);
    const command = startCommand();

    await command.parseAsync([], { from: 'user' });

    expect(createServer).toHaveBeenCalledTimes(1);
    expect(createServer).toHaveBeenCalledWith({ plugins: PLUGINS });
    expect(listen).toHaveBeenCalledTimes(1);
  });
});
