import { describe, expect, it } from 'vitest';
import { getImportInsertion } from './import-insertion.utils';

/**
 * Applies the insertion computed for a template, to read the result as the user would.
 */
const importInto = (source: string, path = './b', symbol = 'B') => {
  const { span, newText } = getImportInsertion(source, path, symbol);
  return `${source.slice(0, span.start)}${newText}${source.slice(span.end)}`;
};

describe('getImportInsertion', () => {
  it.each([
    ['a template without statements', '<p></p>', '@import { B } from \'./b\';\n<p></p>'],
    ['an empty template', '', '@import { B } from \'./b\';\n'],
    ['a template whose text has nothing to do with imports', 'hello', '@import { B } from \'./b\';\nhello'],
    ['a statement from another module', '@import { A } from \'./a\';\n<p></p>', '@import { A } from \'./a\';\n@import { B } from \'./b\';\n<p></p>'],
    ['quotes and semicolon following the last statement', '@import { A } from "./a"\n<p></p>', '@import { A } from "./a"\n@import { B } from "./b"\n<p></p>'],
    ['the last of several statements', '@import { A } from \'./a\';\n@import { C } from \'./c\';\n<p></p>', '@import { A } from \'./a\';\n@import { C } from \'./c\';\n@import { B } from \'./b\';\n<p></p>'],
    ['a statement that cannot be lexed after a valid one', '@import { A } from \'./a\';\n@import oops', '@import { A } from \'./a\';\n@import { B } from \'./b\';\n@import oops']
  ])('writes a new statement for %s', (_name, source, expected) => {
    expect(importInto(source)).toBe(expected);
  });

  it.each([
    ['a statement from the same module', '@import { A } from \'./b\';\n<p></p>', '@import { A, B } from \'./b\';\n<p></p>'],
    ['spaces before the closing brace', '@import { A   } from \'./b\';', '@import { A, B   } from \'./b\';'],
    ['several specifiers', '@import { A, C as D } from \'./b\';', '@import { A, C as D, B } from \'./b\';'],
    ['a trailing comma', '@import { A, } from \'./b\';', '@import { A, B, } from \'./b\';'],
    ['no specifier', '@import { } from \'./b\';', '@import { B } from \'./b\';'],
    ['a statement after another one', '@import { A } from \'./a\';\n@import { C } from \'./b\';', '@import { A } from \'./a\';\n@import { C, B } from \'./b\';']
  ])('adds the symbol to the statement importing from the same module: %s', (_name, source, expected) => {
    expect(importInto(source)).toBe(expected);
  });
});
