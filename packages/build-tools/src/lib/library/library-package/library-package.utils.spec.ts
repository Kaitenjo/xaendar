import type { ComponentOrDirectiveMetadata } from '@xaendar/compiler';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createProgram, type Program } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { LibraryAnalysis } from '../../types/library-analysis.type';
import { toPosixPath } from '../../utils/path/path.utils';
import { createLibraryManifest, createLibraryPackageJson } from './library-package.utils';

/**
 * Temporary directory holding the sources of the fixture library.
 */
let root: string;

/**
 * The program of the fixture library: a card exporting its class and a type, a tile exporting its class only.
 */
let program: Program;

beforeAll(() => {
  root = toPosixPath(realpathSync.native(mkdtempSync(join(tmpdir(), 'xaendar-library-package-'))));
  const files: Record<string, string> = {
    'src/card.ts': 'export type Size = \'small\' | \'large\';\nexport class Card {}\n',
    'src/tile.tsx': 'type Hidden = number;\nexport class Tile {}\n'
  };
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(`${root}/${path}`), { recursive: true });
    writeFileSync(`${root}/${path}`, content);
  }

  program = createProgram([`${root}/src/card.ts`, `${root}/src/tile.tsx`], { jsx: 4 });
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

/**
 * A component of the fixture library, with an input of the given type.
 */
const component = (className: string, type: string) => ({
  type: 'component',
  className,
  selector: `ui-${className.toLowerCase()}`,
  modulePath: `${root}/src/${className.toLowerCase()}.ts`,
  properties: new Map([['size', { name: 'size', type, required: false, exposed: false }]]),
  events: new Map([['picked', { type: `import('${root}/src/card').Card['picked']` }]])
}) as unknown as ComponentOrDirectiveMetadata;

/**
 * What the build reads of the sources of the fixture library, with the given declarations.
 */
const analysisOf = (declarations: Array<[string, ComponentOrDirectiveMetadata]>, ssr = false): LibraryAnalysis => ({
  base: `${root}/src`,
  entry: 'public-api',
  entries: {},
  modules: new Map([[`${root}/src/card.ts`, 'card'], [`${root}/src/tile.tsx`, 'tile']]),
  exports: { '.': { Card: 'card#Card' }, './card': { Card: 'card#Card' } },
  declarations: new Map(declarations),
  selectors: ssr ? ['ui-card'] : ['ui-card', 'ui-tile']
});

/**
 * The library of the fixture, rendering on the server: the manifest reads only its name and its flag.
 */
const LIBRARY = { name: '@acme/ui', root: '/lib', entry: '/lib/src/public-api.ts', ssr: true, customElements: [] };

describe('createLibraryManifest()', () => {
  it('describes the exported components and directives, the modules of the library relative to the root of the package', () => {
    const analysis = analysisOf([['card#Card', component('Card', `import('${root}/src/card').Size | import('@acme/icons').Icon`)]]);

    expect(createLibraryManifest({ version: '1.4.0' }, analysis, program, LIBRARY, '1.2.0')).toEqual({
      schemaVersion: 1,
      name: '@acme/ui',
      version: '1.4.0',
      xaendar: '1.2.0',
      ssr: true,
      exports: analysis.exports,
      declarations: {
        'card#Card': {
          type: 'component',
          className: 'Card',
          selector: 'ui-card',
          module: './card',
          types: './card.d.ts',
          inputs: [{ name: 'size', type: 'import(\'./card\').Size | import(\'@acme/icons\').Icon' }],
          events: [{ name: 'picked', type: 'import(\'./card\').Card[\'picked\']' }]
        }
      },
      selectors: ['ui-card', 'ui-tile']
    });
    expect(createLibraryManifest({}, analysisOf([]), program, LIBRARY, '1.2.0').version).toBe('0.0.0');
    const plain = createLibraryManifest({}, analysisOf([['card#Card', component('Card', 'boolean')]]), program, LIBRARY, '1.2.0');
    expect(plain.declarations['card#Card'].inputs).toEqual([{ name: 'size', type: 'boolean' }]);
  });

  it('throws on a type reading a name its module does not export, or a file outside of the library', () => {
    const analysis = analysisOf([
      ['tile#Tile', component('Tile', `import('${root}/src/tile').Hidden`)],
      ['card#Card', component('Card', 'import(\'/elsewhere/types\').Kind | import(\'C:/elsewhere/types\').Kind')]
    ]);

    expect(() => createLibraryManifest({}, analysis, program, LIBRARY, '1.2.0')).toThrow([
      `tile#Tile: the type of one of its bindings reads Hidden from ${root}/src/tile, which a module of the library must export for the applications to read it.`,
      'card#Card: the type of one of its bindings reads Kind from /elsewhere/types, which a module of the library must export for the applications to read it.',
      'card#Card: the type of one of its bindings reads Kind from C:/elsewhere/types, which a module of the library must export for the applications to read it.'
    ].join('\n'));
  });

  it('throws on a module of the library the program does not hold', () => {
    const analysis = analysisOf([['card#Card', component('Card', `import('${root}/src/missing').Kind`)]]);

    expect(() => createLibraryManifest({}, analysis, program, LIBRARY, '1.2.0')).toThrow(`reads Kind from ${root}/src/missing`);
  });
});

describe('createLibraryPackageJson()', () => {
  it('exports the entry and the exported modules with their declarations and the code of the server, requiring the Xaendar packages', () => {
    const source = {
      name: '@acme/ui',
      version: '1.4.0',
      description: 'Components',
      scripts: { test: 'xd test' },
      devDependencies: { vitest: '^5.0.0' },
      peerDependencies: { '@xaendar/core': '^1.0.0', lit: '^3.0.0' },
      peerDependenciesMeta: { lit: { optional: true } }
    };

    expect(createLibraryPackageJson(source, analysisOf([]), true, '1.2.0')).toEqual({
      name: '@acme/ui',
      version: '1.4.0',
      description: 'Components',
      peerDependencies: { '@xaendar/core': '^1.2.0', '@xaendar/ssr': '^1.2.0', lit: '^3.0.0' },
      peerDependenciesMeta: { lit: { optional: true }, '@xaendar/ssr': { optional: true } },
      type: 'module',
      types: './public-api.d.ts',
      exports: {
        '.': { types: './public-api.d.ts', 'xaendar-server': './server/public-api.js', default: './public-api.js' },
        './card': { types: './card.d.ts', 'xaendar-server': './server/card.js', default: './card.js' },
        './package.json': './package.json',
        './xaendar-manifest.json': './xaendar-manifest.json'
      },
      sideEffects: ['./card.js', './server/card.js', './tile.js', './server/tile.js', './chunks/*.js', './server/chunks/*.js'],
      xaendar: { manifest: './xaendar-manifest.json' }
    });
  });

  it('exports only the code of the browser of a library not rendering on the server', () => {
    const packageJson = createLibraryPackageJson({ name: '@acme/ui' }, analysisOf([]), false, '1.2.0');

    expect(packageJson.exports).toEqual({
      '.': { types: './public-api.d.ts', default: './public-api.js' },
      './card': { types: './card.d.ts', default: './card.js' },
      './package.json': './package.json',
      './xaendar-manifest.json': './xaendar-manifest.json'
    });
    expect(packageJson.sideEffects).toEqual(['./card.js', './tile.js', './chunks/*.js']);
    expect(packageJson.peerDependencies).toEqual({ '@xaendar/core': '^1.2.0' });
    expect(packageJson).not.toHaveProperty('peerDependenciesMeta');
  });
});
