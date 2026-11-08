import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { type Bundle, type CustomTransformers, type Diagnostic, factory, type Program, type TransformationContext, type TransformerFactory } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { toPosixPath } from '../../utils/path/path.utils';
import { createLibraryProgram } from '../library-analysis/library-analysis.utils';
import { emitLibraryDeclarations } from './library-declarations.utils';

/**
 * Temporary directory holding the fixture libraries and their builds.
 */
let root: string;

beforeAll(() => {
  root = toPosixPath(realpathSync.native(mkdtempSync(join(tmpdir(), 'xaendar-library-declarations-'))));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

/**
 * A diagnostic of TypeScript.
 */
const DIAGNOSTIC = { category: 1, code: 6059, file: undefined, start: undefined, length: undefined, messageText: 'File is not under rootDir.' } as Diagnostic;

/**
 * Writes a library whose `tsconfig.json` leads `@ui/*` to its sources, and emits its declarations into its folder
 * `dist`.
 *
 * @param name - The name of the folder of the library.
 * @param files - The files of the library, by path relative to its folder.
 * @returns The folder of the declarations.
 */
function emitLibrary(name: string, files: Record<string, string>): string {
  const libraryRoot = `${root}/${name}`;
  const all: Record<string, string> = Object.assign({
    'tsconfig.json': JSON.stringify({ compilerOptions: { module: 'esnext', moduleResolution: 'bundler', target: 'esnext', noEmit: true, strict: true, paths: { '@ui/*': ['./src/*'] } }, include: ['src/**/*.ts'] })
  }, files);
  for (const [path, content] of Object.entries(all)) {
    mkdirSync(dirname(`${libraryRoot}/${path}`), { recursive: true });
    writeFileSync(`${libraryRoot}/${path}`, content);
  }

  const library = { name: '@acme/ui', root: libraryRoot, entry: `${libraryRoot}/src/public-api.ts`, ssr: false, customElements: [] };
  emitLibraryDeclarations(createLibraryProgram(library, `${libraryRoot}/dist`), `${libraryRoot}/src`);
  return `${libraryRoot}/dist`;
}

describe('emitLibraryDeclarations()', () => {
  it('writes the paths leading to the modules of the library relative to the declarations, with the extension of the build', () => {
    const dist = emitLibrary('relative', {
      'src/public-api.ts': 'export * from \'./card/card\';\nexport { Size } from \'@ui/card/size\';\n',
      'src/card/size.ts': 'export type Size = \'small\' | \'large\';\n',
      'src/card/card.ts': 'import type { Size } from \'@ui/card/size\';\nexport class Card {\n  public size: Size = \'small\';\n  public tile(): import(\'./size\').Size { return this.size; }\n  public element: HTMLElement | undefined;\n}\n'
    });

    expect(readFileSync(`${dist}/public-api.d.ts`, 'utf-8')).toBe('export * from "./card/card.js";\nexport { Size } from "./card/size.js";\n');
    const card = readFileSync(`${dist}/card/card.d.ts`, 'utf-8');
    expect(card).toContain('import type { Size } from "./size.js";');
    expect(card).toContain('tile(): import("./size.js").Size;');
    expect(card).toContain('element: HTMLElement | undefined;');
  });

  it('writes the declaration files of the library the declarations import, and leaves the paths of the packages and the ones written so already', () => {
    const dist = emitLibrary('declaration-files', {
      'src/public-api.ts': 'export * from \'./card/card.js\';\nexport type { Legacy } from \'@ui/types/legacy\';\nexport type { Fake } from \'fake-pkg\';\nexport type { Missing } from \'missing-pkg\';\n',
      'src/card/card.ts': 'import type { Fake } from \'fake-pkg\';\nexport class Card {\n  public fake: Fake = \'\';\n  public other(): import(\'fake-pkg\').Fake { return this.fake; }\n}\n',
      'src/types/legacy.d.ts': 'import type { Card } from \'@ui/card/card\';\nimport type { Tile } from \'@ui/types/tile\';\nexport type Legacy = Card | Tile;\n',
      'src/types/tile.d.ts': 'export type Tile = number;\n',
      'node_modules/fake-pkg/package.json': JSON.stringify({ name: 'fake-pkg', types: 'index.d.ts' }),
      'node_modules/fake-pkg/index.d.ts': 'export type Fake = string;\n'
    });

    expect(readFileSync(`${dist}/public-api.d.ts`, 'utf-8')).toBe([
      'export * from \'./card/card.js\';',
      'export type { Legacy } from "./types/legacy.js";',
      'export type { Fake } from \'fake-pkg\';',
      'export type { Missing } from \'missing-pkg\';',
      ''
    ].join('\n'));
    expect(readFileSync(`${dist}/types/legacy.d.ts`, 'utf-8')).toBe('import type { Card } from "../card/card.js";\nimport type { Tile } from "./tile.js";\nexport type Legacy = Card | Tile;\n');
    expect(readFileSync(`${dist}/types/tile.d.ts`, 'utf-8')).toBe('export type Tile = number;\n');
    const card = readFileSync(`${dist}/card/card.d.ts`, 'utf-8');
    expect(card).toContain('import type { Fake } from \'fake-pkg\';');
    expect(card).toContain('other(): import(\'fake-pkg\').Fake;');
  });

  it('leaves as it is a bundle of declarations', () => {
    const bundle = factory.createBundle([]);
    let transformed: unknown;
    const program = {
      getOptionsDiagnostics: () => [],
      getDeclarationDiagnostics: () => [],
      getCompilerOptions: () => ({ outDir: '/out' }),
      emit: (_file: unknown, _write: unknown, _token: unknown, _declarations: unknown, transformers: CustomTransformers) => {
        transformed = (transformers.afterDeclarations![0] as TransformerFactory<Bundle>)({} as TransformationContext)(bundle);
        return { diagnostics: [] };
      }
    } as unknown as Program;

    emitLibraryDeclarations(program, '/lib/src');

    expect(transformed).toBe(bundle);
  });

  it('throws on the options and on the declarations TypeScript cannot emit', () => {
    const options = { getOptionsDiagnostics: () => [DIAGNOSTIC], getDeclarationDiagnostics: () => [] } as unknown as Program;
    const emitted = { getOptionsDiagnostics: () => [], getDeclarationDiagnostics: () => [], emit: () => ({ diagnostics: [DIAGNOSTIC] }) } as unknown as Program;

    expect(() => emitLibraryDeclarations(options, '/lib/src')).toThrow('File is not under rootDir.');
    expect(() => emitLibraryDeclarations(emitted, '/lib/src')).toThrow('File is not under rootDir.');
  });
});
