import { describe, expect, it } from 'vitest';
import { getImportContext } from './import-context.utils';

/**
 * Returns the import context at the `|` marking the offset of a template.
 */
const contextOf = (template: string) => getImportContext(template.replace('|', ''), template.indexOf('|'));

describe('getImportContext', () => {
  it.each([
    ['nothing written yet', '@import { | } from "./child";', { path: './child', span: { start: 10, end: 10 }, imported: [] }],
    ['no spaces around the cursor', '@import {|} from "./child";', { path: './child', span: { start: 9, end: 9 }, imported: [] }],
    ['a partial name', '@import { Ch| } from "./child";', { path: './child', span: { start: 10, end: 12 }, imported: [] }],
    ['the whole name the cursor is in', '@import { Ch|ild } from "./child";', { path: './child', span: { start: 10, end: 15 }, imported: [] }],
    ['a name after a comma', '@import { Child, | } from \'./child\';', { path: './child', span: { start: 17, end: 17 }, imported: ['Child'] }],
    ['the names already imported, aliases and the current one excluded', '@import { Child as C, To|, Media } from "./x";', { path: './x', span: { start: 22, end: 24 }, imported: ['Child', 'Media'] }],
    ['a statement after another', '@import { A } from "./a";\n@import { | } from "./b";', { path: './b', span: { start: 36, end: 36 }, imported: [] }],
    ['a statement on several lines', '@import {\n  A,\n  |\n} from "./a";', { path: './a', span: { start: 17, end: 17 }, imported: ['A'] }],
    ['a statement followed by a template that cannot be lexed', '@import { | } from "./a";\n<button (click)="onClick foo()"></button>', { path: './a', span: { start: 10, end: 10 }, imported: [] }],
    ['an indented statement', '  @import { | } from "./a"', { path: './a', span: { start: 12, end: 12 }, imported: [] }]
  ])('finds the symbol being written: %s', (_name, template, expected) => {
    expect(contextOf(template)).toEqual(expected);
  });

  it.each([
    ['the alias of a specifier', '@import { Child as | } from "./child";'],
    ['after a name', '@import { Child | } from "./child";'],
    ['before the braces', '@im|port { Child } from "./child";'],
    ['after the braces', '@import { Child } fr|om "./child";'],
    ['a statement without path', '@import { | }'],
    ['a statement after the text of the template', '@import { A } from "./a";\nhello\n@import { | } from "./b";'],
    ['a statement after an element', '<p></p>\n@import { | } from "./a";'],
    ['the space between the keyword and the braces', '@import | { Child } from "./child";'],
    ['a statement without the from keyword', '@import { | } "./child";'],
    ['a template that cannot be lexed up to the offset', '<button (click)="onClick foo()"></button>\n@import { | } from "./a";'],
    ['plain text', 'hel|lo']
  ])('finds nothing on %s', (_name, template) => {
    expect(contextOf(template)).toBeUndefined();
  });
});
