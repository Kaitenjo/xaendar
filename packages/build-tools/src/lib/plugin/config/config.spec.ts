import { findPackageLibraries, type PackageLibrary } from '@xaendar/compiler';
import type { UserConfig } from 'vite';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@xaendar/compiler', async (importOriginal) => ({
  ...await importOriginal<typeof import('@xaendar/compiler')>(),
  findPackageLibraries: vi.fn()
}));

import { createConfigHook } from './config';

/**
 * Runs the hook as Vite does, without the parameters it does not read.
 */
const run = (hook: ReturnType<typeof createConfigHook>) => (hook as unknown as () => unknown)();

/**
 * A library of the workspace, resolved.
 */
const LIBRARY = { name: '@acme/ui', root: '/ws/libraries/ui', entry: '/ws/libraries/ui/src/public-api.ts', ssr: false, customElements: [] };

describe('createConfigHook()', () => {
  it('sets the application type to custom when the plugin renders on the server', () => {
    expect(run(createConfigHook({ ssr: { entry: 'entry-server.ts' } }))).toEqual({ appType: 'custom' });
  });

  it('leads the names of the libraries of the workspace to their sources', () => {
    const config = run(createConfigHook({ libraries: [LIBRARY] })) as { resolve: { alias: Array<{ find: RegExp, replacement: string }> } };

    expect(config.resolve.alias.map(({ find, replacement }) => [find.source, replacement])).toEqual([
      ['^@acme\\/ui$', '/ws/libraries/ui/src/public-api.ts'],
      ['^@acme\\/ui\\/(.*)$', '/ws/libraries/ui/src/$1']
    ]);
    expect(run(createConfigHook({ ssr: { entry: 'entry-server.ts' }, libraries: [LIBRARY] }))).toMatchObject({ appType: 'custom', resolve: { alias: expect.any(Array) } });
  });

  it('leaves the configuration alone otherwise', () => {
    expect(run(createConfigHook({}))).toBeUndefined();
    expect(run(createConfigHook({ libraries: [] }))).toBeUndefined();
  });
});

describe('createConfigHook() with compiled libraries', () => {
  const library = { manifest: { name: '@acme/ui', selectors: [], exports: { '.': {} } } } as unknown as PackageLibrary;

  it('shares the packages of Xaendar with the compiled libraries the project depends on, and optimizes their modules', () => {
    vi.mocked(findPackageLibraries).mockReturnValue([library]);
    const state: Parameters<typeof createConfigHook>[0] = {};
    const config = run(createConfigHook(state)) as UserConfig;

    expect(findPackageLibraries).toHaveBeenCalledWith(process.cwd());
    expect(state.packageLibraries).toEqual([library]);
    expect(config.resolve?.dedupe).toContain('@xaendar/core');
    expect(config.optimizeDeps).toEqual({ include: ['@acme/ui'], exclude: expect.arrayContaining(['@xaendar/core']) });
  });

  it('keeps the aliases of the libraries of the workspace beside them', () => {
    vi.mocked(findPackageLibraries).mockReturnValue([library]);
    const config = run(createConfigHook({ ssr: { entry: 'entry-server.ts' }, libraries: [LIBRARY] })) as UserConfig;

    expect(config).toMatchObject({ appType: 'custom', resolve: { alias: expect.any(Array), dedupe: expect.any(Array) } });
  });
});
