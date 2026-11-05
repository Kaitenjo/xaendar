import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { CatchNode } from '../../types/nodes/catch-node.type';
import { readErrorName } from './error-name.utils';

/**
 * A cursor positioned after the keyword of the first block of a template.
 */
const afterKeyword = (template: string) => {
  const cursor = new ParserCursor(template, new Lexer(template).tokenize());
  cursor.advance();
  return cursor;
};

describe('readErrorName', () => {
  it('reads the name between the parentheses, with its span, consuming it', () => {
    const template = '@error ( failure ) { a }';
    const cursor = afterKeyword(template);
    const node: Pick<CatchNode, 'name' | 'nameSpan'> = {};

    readErrorName(cursor, node, 'error of @error');

    expect(node.name).toBe('failure');
    expect(template.slice(node.nameSpan!.start, node.nameSpan!.end)).toBe('failure');
    expect(cursor.peek().type).toBe(TokenType.BLOCK_OPEN);
  });

  it('reads nothing without parentheses', () => {
    const node: Pick<CatchNode, 'name' | 'nameSpan'> = {};

    readErrorName(afterKeyword('@error { a }'), node, 'error of @error');

    expect(node).toEqual({});
  });

  it('rejects a name a template cannot declare, naming what it names', () => {
    expect(() => readErrorName(afterKeyword('@error (a.b) { c }'), {}, 'error of @error')).toThrow('\'a.b\' is not a valid name for an error of @error: it must be an identifier.');
  });
});
