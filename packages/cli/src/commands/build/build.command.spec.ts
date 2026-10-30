import { build } from 'vite';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vite', () => ({
  build: vi.fn()
}));

const { PLUGINS } = vi.hoisted(() => ({ PLUGINS: [{ name: 'babel' }, { name: 'xaendar' }] }));

vi.mock('../../utils/plugins', () => ({
  createPlugins: () => PLUGINS
}));

vi.mock('../../utils/xaendar-config/xaendar-config.utils', async importOriginal => ({
  ...await importOriginal<typeof import('../../utils/xaendar-config/xaendar-config.utils')>(),
  readXaendarConfig: vi.fn()
}));

import { resolve } from 'node:path';
import { readXaendarConfig } from '../../utils/xaendar-config/xaendar-config.utils';
import { buildCommand } from './build.command';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(build).mockResolvedValue(undefined as unknown as Awaited<ReturnType<typeof build>>);
});

describe('buildCommand()', () => {
  it('registers the "build" command with its "b" alias', () => {
    const command = buildCommand();

    expect(command.name()).toBe('build');
    expect(command.aliases()).toContain('b');
  });

  it('runs a vite build with the shared plugins', async () => {
    const command = buildCommand();

    await command.parseAsync([], { from: 'user' });

    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith({ plugins: PLUGINS });
  });

  it('builds the entry for the server too when the project renders on the server', async () => {
    vi.mocked(readXaendarConfig).mockReturnValue({ ssr: { entry: 'src/entry-server.ts' } });
    const command = buildCommand();

    await command.parseAsync([], { from: 'user' });

    expect(build).toHaveBeenCalledTimes(2);
    expect(build).toHaveBeenNthCalledWith(1, { plugins: PLUGINS });
    expect(build).toHaveBeenNthCalledWith(2, {
      plugins: PLUGINS,
      build: { ssr: resolve('src/entry-server.ts'), outDir: resolve('dist/server'), emptyOutDir: true, copyPublicDir: false }
    });
  });
});
