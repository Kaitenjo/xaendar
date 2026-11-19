import { describe, expect, it } from 'vitest';
import { parseImportStatements } from './import-statements.utils';

/**
 * Returns the statements of a template as `path: imported as local, …`.
 */
const statementsOf = (source: string) => parseImportStatements(source).map(({ path, specifiers }) => `${path}: ${specifiers.map(({ imported, local }) => `${imported} as ${local}`).join(', ')}`);

describe('parseImportStatements', () => {
  it('reads the specifiers and the path of every statement, aliases, default and namespace imports included', () => {
    const source = '@import { A, B as C, default as D, * as all } from \'./a\';\n@import { E } from "./e"\n<b></b>';

    expect(statementsOf(source)).toEqual(['./a: A as A, B as C, default as D, * as all', './e: E as E']);
  });

  it('gives the spans of the specifiers in the template', () => {
    const [{ specifiers }] = parseImportStatements('@import { A, B as C } from \'./a\';');

    expect(specifiers.map(({ importedSpan, localSpan }) => [importedSpan, localSpan])).toEqual([
      [{ start: 10, end: 11 }, { start: 10, end: 11 }],
      [{ start: 13, end: 14 }, { start: 18, end: 19 }]
    ]);
  });

  it('leaves out the empty and the invalid specifiers, and the statements without path', () => {
    expect(statementsOf('@import { A, , B-, C, } from \'./a\';')).toEqual(['./a: A as A, C as C']);
    expect(statementsOf('@import { A } from \'./a\';\n@import { B }')).toEqual(['./a: A as A']);
  });

  it('reads the statements before the part of the template that cannot be lexed, and none from a template without statements', () => {
    expect(statementsOf('@import { A } from \'./a\';\n<button (click)="onClick foo()"></button>')).toEqual(['./a: A as A']);
    expect(statementsOf('<b></b>')).toEqual([]);
  });

  it('does not mix the specifiers of a statement without path with the ones of the next', () => {
    expect(statementsOf('@import { A }\n@import { B } from \'./b\';')).toEqual([]);
  });

  it('reads only the statements the template starts with: the ones after its text or elements are not read', () => {
    expect(statementsOf('@import { A } from \'./a\';\nhello\n@import { B } from \'./b\';')).toEqual(['./a: A as A']);
    expect(statementsOf('@import { A } from \'./a\';\n<p></p>\n@import { B } from \'./b\';')).toEqual(['./a: A as A']);
    expect(statementsOf('@import { A } from \'./a\';\n\n  @import { B } from \'./b\';\n@import { C } from \'./c\'')).toEqual(['./a: A as A', './b: B as B', './c: C as C']);
  });
});
