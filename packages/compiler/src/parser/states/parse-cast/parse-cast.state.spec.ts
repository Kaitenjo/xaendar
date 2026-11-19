import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { parseCast } from './parse-cast.state';

const cursorAt = (template: string, type: TokenType) => {
  const tokens = new Lexer(template).tokenize();
  const cursor = new ParserCursor(template, tokens);
  while (cursor.getCurrentToken().value.type !== type) {
    cursor.advance();
  }

  return cursor;
};

describe('parseCast', () => {
  it('parses the CAST token following the cursor, with the span of the type', () => {
    // The expression and the type hold `as` too, before and after the keyword
    const template = '{ alias as Alias<"as"> }';
    const cursor = cursorAt(template, TokenType.INTERPOLATION_EXPRESSION);

    expect(parseCast(cursor)).toEqual({ text: 'Alias<"as">', span: { start: 11, end: 22 } });
    expect(cursor.getCurrentToken().value.type).toBe(TokenType.CAST);
  });

  it('returns undefined, without advancing, when the next token is not a CAST', () => {
    const cursor = cursorAt('{ value }', TokenType.INTERPOLATION_EXPRESSION);

    expect(parseCast(cursor)).toBeUndefined();
    expect(cursor.getCurrentToken().value.type).toBe(TokenType.INTERPOLATION_EXPRESSION);
  });
});
