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
const run = (hook: ReturnType<typeof createConfigHook>, mode = 'development') => (hook as unknown as (config: object, env: { mode: string }) => unknown)({}, { mode });

/**
 * The security the runtime applies with the defaults of xaendar.json.
 */
const DEFAULT_SECURITY = '{"urls":"warn","resourceUrls":"warn","trustedOrigins":[],"rejectUnsafeBindings":true}';

/**
 * A library of the workspace, resolved.
 */
const LIBRARY = { name: '@acme/ui', root: '/ws/libraries/ui', entry: '/ws/libraries/ui/src/public-api.ts', ssr: false, customElements: [] };

describe('createConfigHook()', () => {
  it('sets the application type to custom when the plugin renders on the server', () => {
    expect(run(createConfigHook({ security: {}, ssr: { entry: 'entry-server.ts' } }))).toEqual({ appType: 'custom', define: { __XAENDAR_DEV__: 'true', __XAENDAR_HYDRATION__: 'true', __XAENDAR_SECURITY__: DEFAULT_SECURITY } });
  });

  it('turns the hydration of core off when the plugin does not render on the server', () => {
    expect(run(createConfigHook({ security: {} }))).toEqual({ define: { __XAENDAR_DEV__: 'true', __XAENDAR_HYDRATION__: 'false', __XAENDAR_SECURITY__: DEFAULT_SECURITY } });
  });

  it('turns the checks of development of core off in the mode production', () => {
    expect(run(createConfigHook({ security: {} }), 'production')).toEqual({ define: { __XAENDAR_DEV__: 'false', __XAENDAR_HYDRATION__: 'false', __XAENDAR_SECURITY__: DEFAULT_SECURITY } });
  });

  it('leads the names of the libraries of the workspace to their sources', () => {
    const config = run(createConfigHook({ security: {}, libraries: [LIBRARY] })) as { resolve: { alias: Array<{ find: RegExp, replacement: string }> } };

    expect(config.resolve.alias.map(({ find, replacement }) => [find.source, replacement])).toEqual([
      ['^@acme\\/ui$', '/ws/libraries/ui/src/public-api.ts'],
      ['^@acme\\/ui\\/(.*)$', '/ws/libraries/ui/src/$1']
    ]);
    expect(run(createConfigHook({ security: {}, ssr: { entry: 'entry-server.ts' }, libraries: [LIBRARY] }))).toMatchObject({ appType: 'custom', resolve: { alias: expect.any(Array) } });
  });

  it('sets nothing else otherwise', () => {
    expect(run(createConfigHook({ security: {}, libraries: [] }))).toEqual({ define: { __XAENDAR_DEV__: 'true', __XAENDAR_HYDRATION__: 'false', __XAENDAR_SECURITY__: DEFAULT_SECURITY } });
  });
});

describe('createConfigHook() with compiled libraries', () => {
  const library = { manifest: { name: '@acme/ui', selectors: [], exports: { '.': {} } } } as unknown as PackageLibrary;

  it('shares the packages of Xaendar with the compiled libraries the project depends on, and optimizes their modules', () => {
    vi.mocked(findPackageLibraries).mockReturnValue([library]);
    const state: Parameters<typeof createConfigHook>[0] = { security: {} };
    const config = run(createConfigHook(state)) as UserConfig;

    expect(findPackageLibraries).toHaveBeenCalledWith(process.cwd());
    expect(state.packageLibraries).toEqual([library]);
    expect(config.resolve?.dedupe).toContain('@xaendar/core');
    expect(config.optimizeDeps).toEqual({ include: ['@acme/ui'], exclude: expect.arrayContaining(['@xaendar/core']) });
  });

  it('keeps the aliases of the libraries of the workspace beside them', () => {
    vi.mocked(findPackageLibraries).mockReturnValue([library]);
    const config = run(createConfigHook({ security: {}, ssr: { entry: 'entry-server.ts' }, libraries: [LIBRARY] })) as UserConfig;

    expect(config).toMatchObject({ appType: 'custom', resolve: { alias: expect.any(Array), dedupe: expect.any(Array) } });
  });
});
