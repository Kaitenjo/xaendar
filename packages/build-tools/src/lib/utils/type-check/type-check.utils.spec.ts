import { disposeLanguageService, getLanguageService, upsertVirtualFile } from '@xaendar/language-core';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { CompilerOptions, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'typescript';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { toPosixPath } from '../path/path.utils';
import { collectFileDiagnostics, collectProjectDiagnostics, formatTypeDiagnostics } from './type-check.utils';

/**
 * Compiler options resolving the fixtures as a bundler does.
 */
const COMPILER_OPTIONS: CompilerOptions = { target: ScriptTarget.ESNext, module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler, noEmit: true, strict: true };

/**
 * Temporary directory holding the fixture files, created once for the whole suite.
 */
let root: string;

beforeAll(() => {
  root = toPosixPath(mkdtempSync(join(tmpdir(), 'xaendar-type-check-')));
  const files: Record<string, string> = {
    'main.ts': `import { lib } from 'lib';\nexport const value: number = 'text';\nexport const total = lib;`,
    'valid.ts': 'export const valid = 1;',
    'node_modules/lib/package.json': '{ "name": "lib", "types": "index.d.ts" }',
    'node_modules/lib/index.d.ts': 'export declare const lib: number;\nexport declare const broken: Missing;'
  };

  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
});

afterEach(() => {
  disposeLanguageService();
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

/**
 * Returns the language service holding the fixtures and a template shim with a type error.
 *
 * @param compilerOptions - The compiler options of the program.
 * @returns The language service.
 */
function createLanguageService(compilerOptions: CompilerOptions = COMPILER_OPTIONS) {
  upsertVirtualFile(`${root}/main.ts.__typecheck__.ts`, 'const shimValue: number = \'text\';');
  return getLanguageService(compilerOptions, [`${root}/main.ts`, `${root}/valid.ts`]);
}

describe('collectProjectDiagnostics()', () => {
  it('collects the errors of the files of the project, leaving out the template shims and the external libraries', () => {
    const diagnostics = collectProjectDiagnostics(createLanguageService());

    expect(diagnostics.map(diagnostic => [diagnostic.file?.fileName, diagnostic.code])).toEqual([[`${root}/main.ts`, 2322]]);
  });

  it('collects the errors of the compiler options', () => {
    const diagnostics = collectProjectDiagnostics(createLanguageService({ ...COMPILER_OPTIONS, noEmit: false, allowImportingTsExtensions: true }));

    expect(diagnostics.map(diagnostic => diagnostic.code)).toEqual([5096, 2322]);
  });
});

describe('collectFileDiagnostics()', () => {
  it('collects the errors of a file of the project', () => {
    const diagnostics = collectFileDiagnostics(createLanguageService(), `${root}/main.ts`);

    expect(diagnostics.map(diagnostic => diagnostic.code)).toEqual([2322]);
  });

  it('returns nothing for a valid file', () => {
    expect(collectFileDiagnostics(createLanguageService(), `${root}/valid.ts`)).toEqual([]);
  });

  it('returns nothing for a template shim, a file of an external library and a file outside the program', () => {
    const languageService = createLanguageService();

    expect(collectFileDiagnostics(languageService, `${root}/main.ts.__typecheck__.ts`)).toEqual([]);
    expect(collectFileDiagnostics(languageService, `${root}/node_modules/lib/index.d.ts`)).toEqual([]);
    expect(collectFileDiagnostics(languageService, `${root}/unknown.ts`)).toEqual([]);
  });
});

describe('formatTypeDiagnostics()', () => {
  it('formats the diagnostics as tsc prints them', () => {
    const diagnostics = collectFileDiagnostics(createLanguageService(), `${root}/main.ts`);

    expect(formatTypeDiagnostics(diagnostics)).toMatch(/main\.ts\(2,14\): error TS2322: Type 'string' is not assignable to type 'number'\./);
  });
});
