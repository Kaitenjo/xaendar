import { describe, expect, it } from 'vitest';
import { findCodeImports } from './code-imports.utils';

/**
 * Finds what the code of a file reads, the modules of the template of the path being any relative one.
 */
const importsOf = (source: string): string[] => [...findCodeImports(['/src/a.ts'], () => source, {})].map(path => path.replace(/^.*\/src\//, ''));

describe('findCodeImports', () => {
  it.each([
    ['a name', 'import { A } from \'./code-imports.utils\';'],
    ['a default import', 'import A from \'./code-imports.utils\';'],
    ['a namespace', 'import * as A from \'./code-imports.utils\';'],
    ['a name among types', 'import { type B, A } from \'./code-imports.utils\';'],
    ['a re-export', 'export { A } from \'./code-imports.utils\';'],
    ['a re-export of everything', 'export * from \'./code-imports.utils\';'],
    ['a dynamic import', 'const load = () => import(\'./code-imports.utils\');']
  ])('finds %s', (_case, source) => {
    const fileNames = [...findCodeImports([`${import.meta.dirname}/a.ts`.replaceAll('\\', '/')], () => source, {})];

    expect(fileNames).toHaveLength(1);
    expect(fileNames[0].endsWith('/code-imports.utils.ts')).toBe(true);
  });

  it.each([
    ['an import for its effects', 'import \'./a\';'],
    ['an import type', 'import type { A } from \'./a\';'],
    ['only types', 'import { type A, type B } from \'./a\';'],
    ['a type-only re-export', 'export type { A } from \'./a\';'],
    ['a local export', 'const a = 1; export { a };'],
    ['a dynamic import of an expression', 'const load = () => import(path);'],
    ['a module that does not exist', 'import { A } from \'./missing\';\nimport(\'./missing\');']
  ])('leaves out %s', (_case, source) => {
    expect(importsOf(source)).toEqual([]);
  });

  it('reads a file that does not exist as an empty one', () => {
    expect(findCodeImports(['/src/a.ts'], () => undefined, {}).size).toBe(0);
  });
});
