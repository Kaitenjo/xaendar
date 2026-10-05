import { build } from 'vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vite', () => ({
  build: vi.fn()
}));

vi.mock('../../utils/plugins', () => ({
  PLUGINS: [{ name: 'babel' }, { name: 'xaendar' }]
}));

import { PLUGINS } from '../../utils/plugins';
import { buildCommand } from './build.command';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildCommand()', () => {
  it('registers the "build" command with its "b" alias', () => {
    const command = buildCommand();

    expect(command.name()).toBe('build');
    expect(command.aliases()).toContain('b');
  });

  it('runs a vite build with the shared plugins', async () => {
    vi.mocked(build).mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof build>>);
    const command = buildCommand();

    await command.parseAsync([], { from: 'user' });

    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith({ plugins: PLUGINS });
  });
});
