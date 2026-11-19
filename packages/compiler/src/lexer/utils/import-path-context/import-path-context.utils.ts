import type { ImportPathContext } from '../../types/import-path-context.type';
import { LexerState } from '../../types/lexer-state.enum';
import { lexImportHeader } from '../import-header/import-header.utils';

/**
 * What ends right before an offset when the path of a module is being written: the `from` keyword, the opening
 * quote, then the path written so far.
 */
const PATH_START = /\bfrom\s*(['"])([^'"\r\n]*)$/;

/**
 * The end of the part of a segment following the cursor: the next slash, the closing quote, the end of the line or of the text.
 */
const SEGMENT_END = /[/'"\r\n]|$/;

/**
 * Tells whether the path of the module of an `@import` statement is being written at an offset of a template, by
 * lexing the header of the template up to the offset: the lexer must be reading the path of a statement, so that the
 * quote is not one of the text.
 *
 * @example
 * getImportPathContext('@import { A } from \'./ui/bu', 28);  // { directory: './ui/', span: { start: 26, end: 28 } }
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The segment of the path being written, `undefined` if the offset is not in the path of an `@import`.
 */
export function getImportPathContext(source: string, offset: number): ImportPathContext | undefined {
  const before = source.slice(0, offset);
  const match = PATH_START.exec(before);
  if (!match) {
    return undefined;
  }

  const { state, error } = lexImportHeader(before);
  if (error || state !== LexerState.IMPORT_PATH) {
    return undefined;
  }

  const [, , written] = match;
  const segmentStart = written.lastIndexOf('/') + 1;
  return {
    directory: written.slice(0, segmentStart),
    span: { start: offset - written.length + segmentStart, end: offset + source.slice(offset).search(SEGMENT_END) }
  };
}
