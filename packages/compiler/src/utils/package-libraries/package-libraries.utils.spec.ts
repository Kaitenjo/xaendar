import { mkdirSync, mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, parse } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { LibraryManifest } from '../../types/library-manifest/library-manifest.type';
import { findLibrary, findPackageLibraries, readLibrary, readLibraryClass, readLibraryMetadata } from './package-libraries.utils';

/**
 * Temporary directory holding the fixture projects.
 */
let root: string;

/**
 * The folder of the project depending on the libraries.
 */
let app: string;

/**
 * The root of the package of the library `@acme/ui`.
 */
let ui: string;

/**
 * Writes some files under the temporary directory, as JSON when they are not strings.
 *
 * @param files - The content of each file, by path relative to the temporary directory.
 */
function write(files: Record<string, unknown>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(`${root}/${path}`), { recursive: true });
    writeFileSync(`${root}/${path}`, typeof content === 'string' ? content : JSON.stringify(content));
  }
}

/**
 * The manifest of a library exporting a card from its entry and from the path of its module.
 *
 * @param name - The name of the package.
 * @param fields - The fields replacing the ones of the manifest.
 * @returns The manifest.
 */
function manifestOf(name: string, fields?: Partial<LibraryManifest>): LibraryManifest {
  return Object.assign({
    schemaVersion: 1,
    name,
    version: '1.0.0',
    xaendar: '1.2.0',
    ssr: false,
    exports: { '.': { Card: 'card/card.xd.component#Card' }, './card/card.xd.component': { Card: 'card/card.xd.component#Card' } },
    declarations: {
      'card/card.xd.component#Card': { type: 'component', className: 'Card', selector: 'ui-card', module: './card/card.xd.component', types: './card/card.xd.component.d.ts', inputs: [], events: [] }
    },
    selectors: ['ui-card', 'ui-internal']
  }, fields);
}

/**
 * The `package.json` of a library whose manifest is `xaendar-manifest.json`.
 *
 * @param name - The name of the package.
 * @param fields - The other fields.
 * @returns The `package.json`.
 */
function packageJsonOf(name: string, fields?: object): object {
  return Object.assign({
    name,
    version: '1.0.0',
    exports: {
      '.': { types: './public-api.d.ts', default: './public-api.js' },
      './card/card.xd.component': { types: './card/card.xd.component.d.ts', default: './card/card.xd.component.js' },
      './package.json': './package.json'
    },
    xaendar: { manifest: './xaendar-manifest.json' }
  }, fields);
}

beforeAll(() => {
  root = realpathSync.native(mkdtempSync(join(tmpdir(), 'xaendar-package-libraries-'))).replaceAll('\\', '/');
  app = `${root}/app`;
  ui = `${app}/node_modules/@acme/ui`;
  write({
    'app/package.json': { name: 'app', dependencies: { '@acme/ui': '^1.0.0', plain: '^1.0.0', missing: '^1.0.0' }, devDependencies: { '@acme/kit': '^1.0.0' } },
    'app/node_modules/@xaendar/core/package.json': { name: '@xaendar/core', version: '1.4.0' },
    'app/node_modules/plain/package.json': { name: 'plain', version: '1.0.0' },
    'app/node_modules/plain/index.d.ts': 'export declare const plain: number;\n',
    'app/node_modules/@acme/ui/package.json': packageJsonOf('@acme/ui'),
    'app/node_modules/@acme/ui/xaendar-manifest.json': manifestOf('@acme/ui'),
    'app/node_modules/@acme/ui/public-api.d.ts': 'export * from \'./card/card.xd.component.js\';\n',
    'app/node_modules/@acme/ui/card/card.xd.component.d.ts': 'export declare class Card {}\n',
    'app/node_modules/@acme/kit/package.json': packageJsonOf('@acme/kit', { dependencies: { '@acme/ui': '^1.0.0' }, peerDependencies: { '@acme/charts': '^1.0.0' } }),
    'app/node_modules/@acme/kit/xaendar-manifest.json': manifestOf('@acme/kit', { selectors: ['kit-card'] }),
    'app/node_modules/@acme/charts/package.json': packageJsonOf('@acme/charts'),
    'app/node_modules/@acme/charts/xaendar-manifest.json': manifestOf('@acme/charts', { selectors: ['charts-card'] }),
    'app/node_modules/@bad/json/package.json': packageJsonOf('@bad/json'),
    'app/node_modules/@bad/json/xaendar-manifest.json': '{ not json',
    'app/node_modules/@bad/schema/package.json': packageJsonOf('@bad/schema'),
    'app/node_modules/@bad/schema/xaendar-manifest.json': manifestOf('@bad/schema', { schemaVersion: 2 as 1 }),
    'app/node_modules/@bad/newer/package.json': packageJsonOf('@bad/newer'),
    'app/node_modules/@bad/newer/xaendar-manifest.json': manifestOf('@bad/newer', { xaendar: '1.5.0' }),
    'app/node_modules/@bad/major/package.json': packageJsonOf('@bad/major'),
    'app/node_modules/@bad/major/xaendar-manifest.json': manifestOf('@bad/major', { xaendar: '2.0.0' }),
    'app/node_modules/@ok/patch/package.json': packageJsonOf('@ok/patch'),
    'app/node_modules/@ok/patch/xaendar-manifest.json': manifestOf('@ok/patch', { xaendar: '1.3.9' }),
    'app/node_modules/@ok/rc/package.json': packageJsonOf('@ok/rc'),
    'app/node_modules/@ok/rc/xaendar-manifest.json': manifestOf('@ok/rc', { xaendar: '1.4.0-rc.1' }),
    'app/node_modules/@bad/patch/package.json': packageJsonOf('@bad/patch'),
    'app/node_modules/@bad/patch/xaendar-manifest.json': manifestOf('@bad/patch', { xaendar: '1.4.1' }),
    'app/node_modules/@acme/legacy/package.json': { name: '@acme/legacy', version: '1.0.0', types: './public-api.d.ts', xaendar: { manifest: './xaendar-manifest.json' } },
    'app/node_modules/@acme/legacy/xaendar-manifest.json': manifestOf('@acme/legacy'),
    'standalone/package.json': packageJsonOf('standalone'),
    'standalone/xaendar-manifest.json': manifestOf('standalone', { xaendar: '9.0.0' }),
    'empty/package.json': { name: 'empty', dependencies: { plain: '^1.0.0' } }
  });
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('readLibraryMetadata()', () => {
  it('reads the component a declaration file of a library exports, from its entry or from the path of its module', () => {
    const metadata = readLibraryMetadata(`${ui}/public-api.d.ts`, 'Card');

    expect(metadata).toMatchObject({ className: 'Card', modulePath: `${ui}/card/card.xd.component.d.ts`, importPath: '@acme/ui/card/card.xd.component', library: { name: '@acme/ui', root: ui, ssr: false } });
    expect(readLibraryMetadata(`${ui}/card/card.xd.component.d.ts`, 'Card')).toBe(metadata);
  });

  it('reads nothing from a file that is not a declaration file of a library, nor a name its path does not export', () => {
    expect(readLibraryMetadata(`${ui}/card/card.xd.component.ts`, 'Card')).toBeUndefined();
    expect(readLibraryMetadata(`${ui}/public-api.d.ts`, 'Nope')).toBeUndefined();
    expect(readLibraryMetadata(`${ui}/package.d.ts`, 'Card')).toBeUndefined();
    expect(readLibraryMetadata(`${app}/node_modules/plain/index.d.ts`, 'plain')).toBeUndefined();
    expect(readLibraryMetadata(`${app}/node_modules/@acme/legacy/public-api.d.ts`, 'Card')).toBeUndefined();
    expect(readLibraryMetadata(`${parse(root).root}xaendar-nothing-here/index.d.ts`, 'Card')).toBeUndefined();
  });
});

describe('readLibraryClass()', () => {
  it('reads a component or a directive of a library from the declaration file declaring its class', () => {
    expect(readLibraryClass(`${ui}/card/card.xd.component.d.ts`, 'Card')).toBe(readLibraryMetadata(`${ui}/public-api.d.ts`, 'Card'));
    expect(readLibraryClass(`${ui}/card/card.xd.component.d.ts`, 'Tile')).toBeUndefined();
    expect(readLibraryClass(`${ui}/card/card.xd.component.ts`, 'Card')).toBeUndefined();
    expect(readLibraryClass(`${app}/node_modules/plain/index.d.ts`, 'Plain')).toBeUndefined();
  });
});

describe('findLibrary()', () => {
  it('reads a library once, and again when its package.json changes', () => {
    const library = findLibrary(`${ui}/card/card.xd.component.d.ts`);

    expect(library?.manifest.name).toBe('@acme/ui');
    expect(library?.subpaths).toEqual(new Map([[`${ui}/public-api.d.ts`.replace(/^[A-Z]:/, drive => drive.toLowerCase()), '.'], [`${ui}/card/card.xd.component.d.ts`.replace(/^[A-Z]:/, drive => drive.toLowerCase()), './card/card.xd.component']]));
    expect(findLibrary(`${ui}/public-api.d.ts`)).toBe(library);

    const later = new Date(Date.now() + 60_000);
    utimesSync(`${ui}/package.json`, later, later);
    expect(findLibrary(`${ui}/public-api.d.ts`)).not.toBe(library);
  });
});

describe('readLibrary()', () => {
  it('reads nothing from a package without a manifest', () => {
    expect(readLibrary(`${app}/node_modules/plain`)).toBeUndefined();
  });

  it('throws on a manifest it cannot read or whose format it does not know', () => {
    expect(() => readLibrary(`${app}/node_modules/@bad/json`)).toThrow(`Cannot read the manifest of @bad/json, ${app}/node_modules/@bad/json/xaendar-manifest.json: SyntaxError`);
    expect(() => readLibrary(`${app}/node_modules/@bad/schema`)).toThrow('The manifest of @bad/schema 1.0.0 has the format 2, which this version of Xaendar does not read: update the Xaendar packages of the project.');
  });

  it('throws on a library compiled by a later version of Xaendar than the @xaendar/core it imports, or by another major version', () => {
    expect(() => readLibrary(`${app}/node_modules/@bad/newer`)).toThrow('@bad/newer 1.0.0 was compiled by Xaendar 1.5.0, and needs @xaendar/core 1.5.0 or a later 1.x version: the project has 1.4.0.');
    expect(() => readLibrary(`${app}/node_modules/@bad/patch`)).toThrow('needs @xaendar/core 1.4.1 or a later 1.x version');
    expect(() => readLibrary(`${app}/node_modules/@bad/major`)).toThrow('needs @xaendar/core 2.0.0 or a later 2.x version');
    expect(readLibrary(`${app}/node_modules/@ok/patch`)?.manifest.xaendar).toBe('1.3.9');
    expect(readLibrary(`${app}/node_modules/@ok/rc`)?.manifest.xaendar).toBe('1.4.0-rc.1');
    expect(readLibrary(`${root}/standalone`)?.manifest.xaendar).toBe('9.0.0');
  });
});

describe('findPackageLibraries()', () => {
  it('finds the libraries a project depends on, and the ones they depend on, once', () => {
    expect(findPackageLibraries(app)?.map(({ manifest }) => manifest.name)).toEqual(['@acme/ui', '@acme/kit', '@acme/charts']);
  });

  it('finds nothing in a folder without a package.json or depending on no library', () => {
    expect(findPackageLibraries(`${root}/nothing`)).toBeUndefined();
    expect(findPackageLibraries(`${root}/empty`)).toBeUndefined();
  });
});
