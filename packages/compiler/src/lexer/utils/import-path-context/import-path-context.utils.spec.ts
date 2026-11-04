import { describe, expect, it } from 'vitest';
import { getImportPathContext } from './import-path-context.utils';

/**
 * Returns the import path context at the `|` marking the offset of a template.
 */
const contextOf = (template: string) => getImportPathContext(template.replace('|', ''), template.indexOf('|'));

describe('getImportPathContext', () => {
  it.each([
    ['nothing written yet', '@import { A } from \'|\';', { directory: '', span: { start: 20, end: 20 } }],
    ['the first segment', '@import { A } from \'.|\';', { directory: '', span: { start: 20, end: 21 } }],
    ['a segment after a slash', '@import { A } from \'./|\';', { directory: './', span: { start: 22, end: 22 } }],
    ['a partial segment', '@import { A } from "./ui/bu|";', { directory: './ui/', span: { start: 25, end: 27 } }],
    ['the whole segment the cursor is in', '@import { A } from \'./ui/bu|tton\';', { directory: './ui/', span: { start: 25, end: 31 } }],
    ['the segment before another one', '@import { A } from \'./u|i/button\';', { directory: './', span: { start: 22, end: 24 } }],
    ['a path without closing quote', '@import { A } from \'../|', { directory: '../', span: { start: 23, end: 23 } }],
    ['a statement after another', '@import { A } from \'./a\';\n@import { B } from \'./|\';', { directory: './', span: { start: 48, end: 48 } }]
  ])('finds the segment of the path being written: %s', (_name, template, expected) => {
    expect(contextOf(template)).toEqual(expected);
  });

  it.each([
    ['the names between the braces', '@import { A| } from \'./a\';'],
    ['the keyword', '@import { A } fr|om \'./a\';'],
    ['after the closing quote', '@import { A } from \'./a\'|;'],
    ['a quote of the text', '<p>from \'./a|\'</p>'],
    ['plain text', 'hel|lo'],
    ['a statement after the text of the template', '<p></p>\n@import { A } from \'./|\';'],
    ['a statement preceded by one that cannot be lexed', '@import oops\n@import { A } from \'./|\';']
  ])('finds nothing on %s', (_name, template) => {
    expect(contextOf(template)).toBeUndefined();
  });
});
