import { describe, expect, it } from 'vitest';
import { formatImportHeader, organizeImports, toImportKey } from './import-organization.utils';

/**
 * Applies the change computed for a template, to read the result as the user would.
 */
const organize = (source: string, options?: Parameters<typeof organizeImports>[1]) => {
  const change = organizeImports(source, options);
  return change ? `${source.slice(0, change.span.start)}${change.newText}${source.slice(change.span.end)}` : source;
};

describe('toImportKey', () => {
  it('writes the key of a specifier, by the path of its module', () => {
    expect(toImportKey('./a', 'B as C')).toBe('./a|B as C');
  });
});

describe('organizeImports', () => {
  it('does nothing for a template without statements, or whose statements are already in a regular form', () => {
    expect(organizeImports('<p></p>', { sort: true })).toBeUndefined();
    expect(organizeImports('@import { A, B } from \'./a\';\n<p></p>', { sort: true })).toBeUndefined();
    expect(organizeImports('@import { B, A } from \'./a\';\n<p></p>')).toBeUndefined();
  });

  it('removes the unused specifiers, and the statements left without any', () => {
    const source = '@import { A, B, C as D } from \'./a\';\n@import { E } from \'./e\';\n<p></p>';
    const unused = new Set([toImportKey('./a', 'B'), toImportKey('./a', 'C as D'), toImportKey('./e', 'E')]);

    expect(organize(source, { unused })).toBe('@import { A } from \'./a\';\n<p></p>');
  });

  it('removes the statements of a header whose specifiers are all unused, with the spaces following them', () => {
    const source = '@import { A } from \'./a\';\n\n<p></p>';

    expect(organize(source, { unused: new Set([toImportKey('./a', 'A')]) })).toBe('<p></p>');
  });

  it('keeps the order of the statements and of the specifiers when it does not sort', () => {
    const source = '@import { B, A } from \'./b\';\n@import { C } from \'./a\';\n@import { D } from \'./b\';\n<p></p>';

    expect(organize(source, { unused: new Set([toImportKey('./b', 'A')]) })).toBe('@import { B } from \'./b\';\n@import { C } from \'./a\';\n@import { D } from \'./b\';\n<p></p>');
  });

  it('sorts the specifiers by name ignoring the case, the aliased ones by what they import', () => {
    expect(organize('@import { b, C as A, a, B } from \'./a\';', { sort: true })).toBe('@import { a, b, B, C as A } from \'./a\';');
  });

  it('merges the statements importing from the same module, dropping the specifiers written twice', () => {
    const source = '@import { B, A } from \'./a\';\n@import { C, A } from \'./a\';';

    expect(organize(source, { sort: true })).toBe('@import { A, B, C } from \'./a\';');
  });

  it('sorts the statements by path, the bare module names before the relative paths', () => {
    const source = '@import { A } from \'./b\';\n@import { B } from \'../c\';\n@import { C } from \'@xaendar/lib\';\n@import { D } from \'./B2\';\n@import { E } from \'./a\';';

    expect(organize(source, { sort: true })).toBe([
      '@import { C } from \'@xaendar/lib\';',
      '@import { B } from \'../c\';',
      '@import { E } from \'./a\';',
      '@import { A } from \'./b\';',
      '@import { D } from \'./B2\';'
    ].join('\n'));
  });

  it('writes again the statements in a regular form, keeping the quote, the semicolon and the lines of each', () => {
    const source = '@import {A,B} from "./a"\n@import {\n  C,\n  D\n} from \'./b\';\n<p></p>';

    expect(organize(source, { sort: true })).toBe('@import { A, B } from "./a"\n@import {\n  C,\n  D\n} from \'./b\';\n<p></p>');
  });

  it('keeps the line breaks of a template written with CRLF', () => {
    const source = '@import { B } from \'./b\';\r\n@import {\r\n  D,\r\n  C\r\n} from \'./a\';\r\n<p></p>';

    expect(organize(source, { sort: true })).toBe('@import {\r\n  C,\r\n  D\r\n} from \'./a\';\r\n@import { B } from \'./b\';\r\n<p></p>');
  });

  it('ignores the empty specifier of a trailing comma, and a statement that cannot be lexed', () => {
    expect(organize('@import { B, A, } from \'./a\';\n@import oops', { sort: true })).toBe('@import { A, B } from \'./a\';\n@import oops');
  });

  it('organizes only the header of the template', () => {
    expect(organize('@import { B, A } from \'./a\';\n<p>@import { D, C } from \'./c\';</p>', { sort: true })).toBe('@import { A, B } from \'./a\';\n<p>@import { D, C } from \'./c\';</p>');
  });
});

describe('organizeImports with comments', () => {
  const source = [
    '@import { B } from \'./b\';   <!-- b -->',
    '<!-- before a -->',
    '@import { A } from \'./a\';',
    '@import { C } from \'./b\'; <!-- c -->',
    '<p></p>'
  ].join('\n');

  it('keeps the comments written after a statement, as written, moving them with it', () => {
    expect(organize(source, { sort: true })).toBe([
      '@import { A } from \'./a\';',
      '@import { B, C } from \'./b\';   <!-- b -->',
      '<!-- before a --> <!-- c -->',
      '<p></p>'
    ].join('\n'));
  });

  it('removes the comments written after a statement removed', () => {
    expect(organize(source, { unused: new Set([toImportKey('./b', 'B')]) })).toBe([
      '@import { A } from \'./a\';',
      '@import { C } from \'./b\'; <!-- c -->',
      '<p></p>'
    ].join('\n'));
  });
});

describe('formatImportHeader', () => {
  it('keeps the comments between the statements and on the line of the last one, as written', () => {
    const source = '@import {A} from \'./a\'   <!-- a -->\n\n<!-- own line -->\n@import {B} from \'./b\' <!-- b --> <!-- again -->\n<!-- not in the header -->\n<p></p>';
    const header = formatImportHeader(source)!;

    expect(header.text).toBe('@import { A } from \'./a\'   <!-- a -->\n\n<!-- own line -->\n@import { B } from \'./b\' <!-- b --> <!-- again -->');
    expect(source.slice(header.end)).toBe('\n<!-- not in the header -->\n<p></p>');
  });
});
