import type { PackageLibrary } from '@xaendar/compiler';
import { afterEach, describe, expect, it } from 'vitest';
import { clearMetadataRegistry, getLibrarySelectorOwner } from '../../registry/metadata-registry/metadata-registry';
import { getPackageLibrariesConfig, registerPackageLibraries } from './package-libraries.utils';

/**
 * A compiled library exporting an entry and a module, defining the given selectors.
 */
const libraryOf = (name: string, selectors: string[]) => ({
  manifest: { name, selectors, exports: { '.': {}, './card/card.xd.component': {} } }
}) as unknown as PackageLibrary;

afterEach(() => {
  clearMetadataRegistry();
});

describe('getPackageLibrariesConfig()', () => {
  it('shares the packages of Xaendar with the libraries, and optimizes every module they export but the packages of Xaendar', () => {
    const packages = ['@xaendar/core', '@xaendar/signals', '@xaendar/common', '@xaendar/types', '@xaendar/ssr'];

    expect(getPackageLibrariesConfig([libraryOf('@acme/ui', []), libraryOf('charts', [])])).toEqual({
      resolve: { dedupe: packages },
      optimizeDeps: { include: ['@acme/ui', '@acme/ui/card/card.xd.component', 'charts', 'charts/card/card.xd.component'], exclude: packages }
    });
  });
});

describe('registerPackageLibraries()', () => {
  it('registers the selectors of the libraries', () => {
    registerPackageLibraries([libraryOf('@acme/ui', ['ui-card', '@@uiTip'])]);

    expect(getLibrarySelectorOwner('@@uiTip')).toBe('@acme/ui');
  });

  it('throws on a selector two libraries define', () => {
    expect(() => registerPackageLibraries([libraryOf('@acme/ui', ['ui-card']), libraryOf('@other/kit', ['ui-card'])])).toThrow('Selector "ui-card" is defined by both @acme/ui and @other/kit');
  });
});
