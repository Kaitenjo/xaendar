import type { Plugin } from 'vite';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../plugin/plugin/plugin', () => ({
  xaendarPlugin: vi.fn((options: unknown) => ({ name: 'xaendar', options }))
}));

import { xaendarPlugin } from '../../plugin/plugin/plugin';
import type { LibraryAnalysis } from '../../types/library-analysis.type';
import { createExternalMatcher, createLibraryBuildConfig } from './library-build-config.utils';

/**
 * A library of the workspace, resolved.
 */
const LIBRARY = { name: '@acme/ui', root: '/ws/libraries/ui', entry: '/ws/libraries/ui/src/public-api.ts', ssr: true, customElements: [] };

/**
 * What the build reads of the sources of the library.
 */
const ANALYSIS = {
  base: '/ws/libraries/ui/src',
  entry: 'public-api',
  entries: { 'public-api': '/ws/libraries/ui/src/public-api.ts', 'card/card.xd.component': '/ws/libraries/ui/src/card/card.xd.component.ts' },
  modules: new Map([['/ws/libraries/ui/src/card/card.xd.component.ts', 'card/card.xd.component']]),
  exports: {},
  declarations: new Map(),
  selectors: []
} as LibraryAnalysis;

describe('createExternalMatcher()', () => {
  it('leaves out the Xaendar packages and the dependencies of the library, by name or by path', () => {
    const external = createExternalMatcher({ dependencies: { lit: '^3.0.0' }, peerDependencies: { '@acme/icons': '^1.0.0' } });

    expect(external('@xaendar/core')).toBe(true);
    expect(external('@xaendar/core/signals')).toBe(true);
    expect(external('lit')).toBe(true);
    expect(external('lit/decorators.js')).toBe(true);
    expect(external('@acme/icons')).toBe(true);
    expect(external('lit-element')).toBe(false);
    expect(external('./card')).toBe(false);
    expect(createExternalMatcher({})('lit')).toBe(false);
  });
});

describe('createLibraryBuildConfig()', () => {
  it('builds an ES module for each entry, without minifying the code nor writing the ids of the modules', () => {
    const babel = { name: 'babel' };
    const external = () => false;

    const config = createLibraryBuildConfig(LIBRARY, [babel], ANALYSIS, '/ws/dist/ui', external, false);

    expect(config).toMatchObject({
      configFile: false,
      root: '/ws/libraries/ui',
      build: {
        outDir: '/ws/dist/ui',
        emptyOutDir: true,
        copyPublicDir: false,
        minify: false,
        cssMinify: true,
        target: 'esnext',
        ssr: false,
        lib: { entry: ANALYSIS.entries, formats: ['es'] },
        rolldownOptions: { external, output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[hash].js' }, experimental: { attachDebugInfo: 'none' } }
      }
    });
    expect(config.ssr).toBeUndefined();
    expect(config.plugins?.map(plugin => (plugin as Plugin).name)).toEqual(['babel', 'xaendar', 'xaendar:library-side-effects']);
    expect(xaendarPlugin).toHaveBeenCalledWith({ library: LIBRARY });
  });

  it('builds the library for the server into the folder server, its dependencies inlined but the external ones', () => {
    const config = createLibraryBuildConfig(LIBRARY, undefined, ANALYSIS, '/ws/dist/ui', () => false, true);

    expect(config.build).toMatchObject({ outDir: '/ws/dist/ui/server', ssr: true });
    expect(config.ssr).toEqual({ noExternal: true });
    expect(config.plugins?.map(plugin => (plugin as Plugin).name)).toEqual(['xaendar', 'xaendar:library-side-effects']);
  });

  it('marks the modules declaring a component or a directive as having side effects', () => {
    const plugin = createLibraryBuildConfig(LIBRARY, [], ANALYSIS, '/ws/dist/ui', () => false, false).plugins!.at(-1) as Plugin;
    const transform = plugin.transform as (code: string, id: string) => unknown;

    expect(transform('code', '/ws/libraries/ui/src/card/card.xd.component.ts')).toEqual({ code: 'code', moduleSideEffects: true });
    expect(transform('code', '/ws/libraries/ui/src/format.ts')).toBeUndefined();
  });
});
