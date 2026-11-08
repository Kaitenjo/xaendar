import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { WorkspaceLibrary } from '../../types/workspace-library.type';
import { toPosixPath } from '../../utils/path/path.utils';
import { analyzeLibrary, createLibraryProgram } from './library-analysis.utils';

/**
 * Temporary directory holding the fixture libraries.
 */
let root: string;

/**
 * Incrementing id giving each case a library of its own.
 */
let counter = 0;

beforeAll(() => {
  root = toPosixPath(realpathSync.native(mkdtempSync(join(tmpdir(), 'xaendar-library-analysis-'))));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

/**
 * Writes a library whose `tsconfig.json` includes its sources, with the given files.
 *
 * @param files - The files, by path relative to the folder of the library.
 * @returns The library, its entry `src/public-api.ts`.
 */
function writeLibrary(files: Record<string, string>): WorkspaceLibrary {
  const libraryRoot = `${root}/case-${counter++}`;
  const all: Record<string, string> = Object.assign({ 'tsconfig.json': JSON.stringify({ compilerOptions: { module: 'esnext', moduleResolution: 'bundler', target: 'esnext', noEmit: true }, include: ['**/*.ts'] }) }, files);
  for (const [path, content] of Object.entries(all)) {
    mkdirSync(dirname(`${libraryRoot}/${path}`), { recursive: true });
    writeFileSync(`${libraryRoot}/${path}`, content);
  }

  return { name: '@acme/ui', root: libraryRoot, entry: `${libraryRoot}/src/public-api.ts`, ssr: false, customElements: [] };
}

/**
 * The source of a module declaring a component.
 */
const component = (className: string, selector: string) => `@WebComponent({ selector: '${selector}', templateUrl: './card.html' })\nexport class ${className} {}\n`;

describe('createLibraryProgram()', () => {
  it('emits only the declarations of the sources, relative to the folder of the entry, into the folder of the build', () => {
    const library = writeLibrary({ 'src/public-api.ts': 'export const a = 1;\n' });
    const options = createLibraryProgram(library, '/out').getCompilerOptions();

    expect(options).toMatchObject({ noEmit: false, declaration: true, emitDeclarationOnly: true, declarationMap: false, sourceMap: false, rootDir: `${library.root}/src`, outDir: '/out' });
  });
});

describe('analyzeLibrary()', () => {
  it('makes an entry of every module declaring a component or a directive, and exports the modules of the exported ones', async () => {
    const library = writeLibrary({
      'src/public-api.ts': 'export * from \'./card/card.xd.component\';\nexport { TipDirective as Tip } from \'./tip/tip.directive\';\nexport const VERSION = 1;\nexport class Plain {}\n',
      'src/card/card.xd.component.ts': component('CardComponent', 'ui-card'),
      'src/tip/tip.directive.ts': '@Directive({ selector: \'uiTip\' })\nexport class TipDirective {}\n',
      'src/inner/inner.xd.component.ts': component('InnerComponent', 'ui-inner'),
      'src/utils/format.ts': 'export function format(): string { return \'\'; }\n'
    });
    const src = `${library.root}/src`;

    const analysis = await analyzeLibrary(library, createLibraryProgram(library, '/out'));

    expect(analysis.base).toBe(src);
    expect(analysis.entry).toBe('public-api');
    expect(analysis.entries).toEqual({
      'public-api': `${src}/public-api.ts`,
      'card/card.xd.component': `${src}/card/card.xd.component.ts`,
      'tip/tip.directive': `${src}/tip/tip.directive.ts`,
      'inner/inner.xd.component': `${src}/inner/inner.xd.component.ts`
    });
    expect([...analysis.modules.values()].sort()).toEqual(['card/card.xd.component', 'inner/inner.xd.component', 'tip/tip.directive']);
    expect(analysis.exports).toEqual({
      '.': { CardComponent: 'card/card.xd.component#CardComponent', Tip: 'tip/tip.directive#TipDirective' },
      './card/card.xd.component': { CardComponent: 'card/card.xd.component#CardComponent' },
      './tip/tip.directive': { TipDirective: 'tip/tip.directive#TipDirective' }
    });
    expect([...analysis.declarations.keys()].sort()).toEqual(['card/card.xd.component#CardComponent', 'tip/tip.directive#TipDirective']);
    expect(analysis.declarations.get('tip/tip.directive#TipDirective')).toMatchObject({ type: 'directive', selector: 'uiTip' });
    expect([...analysis.selectors].sort()).toEqual(['@@uiTip', 'ui-card', 'ui-inner']);
  });

  it('exports nothing from an entry that is not a module', async () => {
    const library = writeLibrary({ 'src/public-api.ts': 'const local = 1;\n', 'src/card/card.xd.component.ts': component('CardComponent', 'ui-card') });

    const analysis = await analyzeLibrary(library, createLibraryProgram(library, '/out'));

    expect(analysis.exports).toEqual({ '.': {} });
    expect(analysis.declarations.size).toBe(0);
    expect(analysis.selectors).toEqual(['ui-card']);
  });

  it('throws on a component declared outside of the folder of the entry', async () => {
    const library = writeLibrary({ 'src/public-api.ts': 'export {};\n', 'other/card.xd.component.ts': component('CardComponent', 'ui-card') });

    await expect(analyzeLibrary(library, createLibraryProgram(library, '/out'))).rejects.toThrow(`${library.root}/other/card.xd.component.ts declares a component or a directive outside of ${library.root}/src, the folder of the entry of @acme/ui.`);
  });

  it('throws on a selector declared twice', async () => {
    const library = writeLibrary({
      'src/public-api.ts': 'export {};\n',
      'src/card.xd.component.ts': component('CardComponent', 'ui-card'),
      'src/tile.xd.component.ts': component('TileComponent', 'ui-card')
    });

    await expect(analyzeLibrary(library, createLibraryProgram(library, '/out'))).rejects.toThrow('The selector "ui-card" of TileComponent is declared twice in @acme/ui.');
  });
});
