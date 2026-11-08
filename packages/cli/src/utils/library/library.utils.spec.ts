import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { addLibraryExport, addLibraryPaths, addLibraryToConfig, findProjectLibrary, getExampleComponentName, getLibraryPaths, toWorkspaceLibrary } from './library.utils';

/**
 * A library of a workspace.
 */
const UI = { name: '@acme/ui', folder: 'ui', ssr: false };

/**
 * A workspace with two libraries.
 */
const WORKSPACE = {
  dir: resolve('/ws'),
  configPath: resolve('/ws/xaendar.json'),
  config: { libs: { '@acme/ui': { root: 'libraries/ui' }, charts: { root: 'libraries/charts', entry: 'lib/index.ts' } } }
};

/**
 * Temporary directory holding the entries written by the specs.
 */
let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-library-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Makes `process.exit` throw, so that a spec sees where the process stops, and silences the errors it prints.
 *
 * @returns The spy of `console.error`.
 */
function stopOnExit() {
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit');
  });
  return vi.spyOn(console, 'error').mockImplementation(() => undefined);
}

describe('toWorkspaceLibrary()', () => {
  it('names the folder of the library after its package, without the scope', () => {
    expect(toWorkspaceLibrary('@acme/ui', true)).toEqual({ name: '@acme/ui', folder: 'ui', ssr: true });
    expect(toWorkspaceLibrary('charts', false)).toEqual({ name: 'charts', folder: 'charts', ssr: false });
  });

  it('exits on a name that is not the one of an npm package', () => {
    const error = stopOnExit();

    expect(() => toWorkspaceLibrary('Acme UI', false)).toThrow('process.exit');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Invalid library name "Acme UI"'));
  });

  it('exits on a folder that cannot name a custom element', () => {
    stopOnExit();

    expect(() => toWorkspaceLibrary('@acme/1ui', false)).toThrow('process.exit');
  });
});

describe('getExampleComponentName()', () => {
  it('names the example component after the folder of the library', () => {
    expect(getExampleComponentName('ui')).toBe('ui-example');
  });
});

describe('addLibraryToConfig()', () => {
  it('adds the library to the libs, with ssr only when it renders on the server, keeping the final line break', () => {
    const text = `${JSON.stringify({ name: 'ws', libs: { charts: { root: 'libraries/charts' } } }, null, 2)}\n`;

    expect(JSON.parse(addLibraryToConfig(text, UI))).toEqual({ name: 'ws', libs: { charts: { root: 'libraries/charts' }, '@acme/ui': { root: 'libraries/ui' } } });
    expect(addLibraryToConfig(text, UI).endsWith('}\n')).toBe(true);
    expect(addLibraryToConfig('{ "name": "ws" }', { ...UI, ssr: true })).toBe(JSON.stringify({ name: 'ws', libs: { '@acme/ui': { root: 'libraries/ui', ssr: true } } }, null, 2));
  });
});

describe('addLibraryPaths()', () => {
  it('leads the name of the library to its entry, and to the files of its sources', () => {
    const tsconfig = JSON.stringify({ compilerOptions: { strict: true, paths: { '@/*': ['./src/*'] } }, include: ['src/**/*.ts'] });

    expect(JSON.parse(addLibraryPaths(tsconfig, UI))).toEqual({
      compilerOptions: { strict: true, paths: { '@/*': ['./src/*'], '@acme/ui': ['./libraries/ui/src/public-api.ts'], '@acme/ui/*': ['./libraries/ui/src/*'] } },
      include: ['src/**/*.ts']
    });
    expect(JSON.parse(addLibraryPaths('{}', UI))).toEqual({ compilerOptions: { paths: getLibraryPaths(UI) } });
  });

  it('throws on a tsconfig.json holding comments', () => {
    expect(() => addLibraryPaths('{ /* options */ }', UI)).toThrow();
  });
});

describe('findProjectLibrary()', () => {
  it('finds the library named by its package or by its folder, its paths resolved', () => {
    const ui = { name: '@acme/ui', root: resolve('/ws/libraries/ui'), entry: resolve('/ws/libraries/ui/src/public-api.ts') };

    expect(findProjectLibrary(WORKSPACE, resolve('/elsewhere'), '@acme/ui')).toEqual(ui);
    expect(findProjectLibrary(WORKSPACE, resolve('/elsewhere'), 'ui')).toEqual(ui);
    expect(findProjectLibrary(WORKSPACE, resolve('/elsewhere'), 'charts')).toEqual({ name: 'charts', root: resolve('/ws/libraries/charts'), entry: resolve('/ws/libraries/charts/lib/index.ts') });
  });

  it('finds the library holding a directory, none outside of the libraries', () => {
    expect(findProjectLibrary(WORKSPACE, resolve('/ws/libraries/charts'))?.name).toBe('charts');
    expect(findProjectLibrary(WORKSPACE, resolve('/ws/libraries/ui/src/cards'))?.name).toBe('@acme/ui');
    expect(findProjectLibrary(WORKSPACE, resolve('/ws/src'))).toBeUndefined();
    expect(findProjectLibrary({ ...WORKSPACE, config: {} }, resolve('/ws/libraries/ui'))).toBeUndefined();
  });

  it('exits when no library has the name given', () => {
    const error = stopOnExit();

    expect(() => findProjectLibrary(WORKSPACE, resolve('/ws'), 'missing')).toThrow('process.exit');
    expect(error).toHaveBeenCalledWith(`✖  No library "missing" in the libs of ${WORKSPACE.configPath}.`);
    expect(() => findProjectLibrary({ ...WORKSPACE, config: {} }, resolve('/ws'), 'ui')).toThrow('process.exit');
  });
});

describe('addLibraryExport()', () => {
  it('exports the component from the entry once, on a line of its own', () => {
    const dir = join(root, 'export');
    mkdirSync(join(dir, 'src'), { recursive: true });
    const entry = join(dir, 'src', 'public-api.ts');
    writeFileSync(entry, 'export * from \'./ui-example/ui-example.xd.component\';');

    addLibraryExport(entry, join(dir, 'src', 'cards', 'ui-card', 'ui-card.xd.component.ts'));
    addLibraryExport(entry, join(dir, 'src', 'cards', 'ui-card', 'ui-card.xd.component.ts'));
    addLibraryExport(entry, join(dir, 'src', 'ui-tile', 'ui-tile.xd.component.ts'));

    expect(readFileSync(entry, 'utf-8')).toBe([
      'export * from \'./ui-example/ui-example.xd.component\';',
      'export * from \'./cards/ui-card/ui-card.xd.component\';',
      'export * from \'./ui-tile/ui-tile.xd.component\';',
      ''
    ].join('\n'));
  });

  it('creates the entry when it does not exist, and writes a path outside of its folder as it is', () => {
    const dir = join(root, 'missing-entry');
    mkdirSync(join(dir, 'lib'), { recursive: true });
    const entry = join(dir, 'lib', 'index.ts');

    addLibraryExport(entry, join(dir, 'src', 'ui-card', 'ui-card.xd.component.ts'));

    expect(readFileSync(entry, 'utf-8')).toBe('export * from \'../src/ui-card/ui-card.xd.component\';\n');
  });
});
