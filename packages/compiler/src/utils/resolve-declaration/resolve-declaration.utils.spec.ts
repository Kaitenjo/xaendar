import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createSourceFile, isClassDeclaration, ScriptTarget, VariableStatement } from 'typescript';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSourceFileCache, resolveBaseClassOf, resolveClassReference } from './resolve-declaration.utils';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    readFileSync: vi.fn(actual.readFileSync)
  };
});

/**
 * Temporary directory holding the fixture files, created once for the whole suite.
 */
let root: string;

/**
 * Incrementing id used to give each case its own fixture sub-directory.
 */
let counter = 0;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-resolve-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

beforeEach(() => {
  clearSourceFileCache();
  vi.mocked(readFileSync).mockClear();
});

/**
 * Writes `content` to `file`, creating its parent directory if missing.
 *
 * @param file - Absolute path of the file to write.
 * @param content - The file content.
 */
const write = (file: string, content: string): void => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

/**
 * Converts a path to posix form, replacing backslashes with slashes.
 *
 * @param path - The path to convert.
 * @returns The path in posix format.
 */
const posix = (path: string): string => path.replace(/\\/g, '/');

/**
 * Parses `source`, placed in a fresh directory, and resolves the base class of its `Cmp` class.
 *
 * @param source - The TypeScript source declaring a `Cmp` class.
 * @param prepare - Callback adding sibling fixture files to the fresh directory.
 * @returns The name of the resolved base class and the file declaring it, relative to the directory.
 */
const resolve = (source: string, prepare: (dir: string) => void = () => undefined): { name: string | undefined, file: string } | undefined => {
  const dir = posix(join(root, `case-${counter++}`));
  mkdirSync(dir, { recursive: true });
  prepare(dir);
  const sourceFile = createSourceFile(`${dir}/main.ts`, source, ScriptTarget.Latest, true);
  const declaration = sourceFile.statements.filter(isClassDeclaration).find(statement => statement.name?.text === 'Cmp')!;
  const base = resolveBaseClassOf({ sourceFile, declaration });
  return base && { name: base.declaration.name?.text, file: posix(base.sourceFile.fileName).replace(`${dir}/`, '') };
};

describe('resolveBaseClassOf', () => {
  it('resolves the base class declared in the file or imported into it', () => {
    expect(resolve('class Base {}\nclass Cmp extends Base {}')).toEqual({ name: 'Base', file: 'main.ts' });
    expect(resolve('import { Base } from \'./base\';\nclass Cmp extends Base {}', dir => write(`${dir}/base.ts`, 'export class Base {}'))).toEqual({ name: 'Base', file: 'base.ts' });
  });

  it('resolves the base class through namespace imports and re-exports', () => {
    expect(resolve('import * as ns from \'./barrel\';\nclass Cmp extends ns.Base {}', dir => {
      write(`${dir}/barrel.ts`, 'export * from \'./base\';');
      write(`${dir}/base.ts`, 'export class Base {}');
    })).toEqual({ name: 'Base', file: 'base.ts' });
  });

  it('resolves nothing when the class extends nothing or an unknown class', () => {
    expect(resolve('class Cmp {}')).toBeUndefined();
    expect(resolve('class Cmp extends Missing {}')).toBeUndefined();
  });
});

describe('resolveClassReference', () => {
  /**
   * Parses `source`, placed in a fresh directory, and resolves the class its last statement, an expression, refers to.
   */
  const resolveExpression = (source: string, expression: string, prepare: (dir: string) => void = () => undefined) => {
    const dir = posix(join(root, `case-${counter++}`));
    mkdirSync(dir, { recursive: true });
    prepare(dir);
    const sourceFile = createSourceFile(`${dir}/main.ts`, `${source}\nconst target = ${expression};`, ScriptTarget.Latest, true);
    const statement = sourceFile.statements.at(-1) as VariableStatement;
    const resolved = resolveClassReference(sourceFile, statement.declarationList.declarations[0].initializer!);

    return resolved && { name: resolved.declaration.name?.text, file: posix(resolved.sourceFile.fileName).replace(`${dir}/`, '') };
  };

  it('resolves a class declared in the file or imported into it', () => {
    expect(resolveExpression('class Tooltip {}', 'Tooltip')).toEqual({ name: 'Tooltip', file: 'main.ts' });
    expect(resolveExpression('import { Tooltip } from \'./tooltip\';', 'Tooltip', dir => write(`${dir}/tooltip.ts`, 'export class Tooltip {}'))).toEqual({ name: 'Tooltip', file: 'tooltip.ts' });
  });

  it('resolves a class through a namespace import', () => {
    expect(resolveExpression('import * as ns from \'./tooltip\';', 'ns.Tooltip', dir => write(`${dir}/tooltip.ts`, 'export class Tooltip {}'))).toEqual({ name: 'Tooltip', file: 'tooltip.ts' });
  });

  it('resolves nothing for an unknown class or an expression that is not a name', () => {
    expect(resolveExpression('', 'Missing')).toBeUndefined();
    expect(resolveExpression('', 'make()')).toBeUndefined();
  });
});

describe('clearSourceFileCache', () => {
  it('makes an unchanged file be parsed again', () => {
    const dir = posix(join(root, `case-${counter++}`));
    const basePath = `${dir}/base.ts`;
    write(basePath, 'export class Base {}');
    const sourceFile = createSourceFile(`${dir}/main.ts`, 'import { Base } from \'./base\';\nclass Cmp extends Base {}', ScriptTarget.Latest, true);
    const declaration = sourceFile.statements.filter(isClassDeclaration)[0];
    const baseReads = () => vi.mocked(readFileSync).mock.calls.filter(([path]) => path === basePath).length;

    resolveBaseClassOf({ sourceFile, declaration });
    resolveBaseClassOf({ sourceFile, declaration });
    expect(baseReads()).toBe(1);

    clearSourceFileCache();
    resolveBaseClassOf({ sourceFile, declaration });
    expect(baseReads()).toBe(2);
  });
});
