import { describe, expect, it } from 'vitest';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { ParserCursor } from './parser-cursor.model';

const tokens: Token[] = [
  { type: TokenType.TEXT, parts: ['a'], span: { start: 0, end: 1 } },
  { type: TokenType.TEXT, parts: ['b'], span: { start: 1, end: 2 } },
  { type: TokenType.TEXT, parts: ['c'], span: { start: 2, end: 3 } }
];

const eof = { type: TokenType.EOF };

describe('ParserCursor', () => {
  describe('getCurrentToken', () => {
    it('starts on an EOF token with index -1', () => {
      const cursor = new ParserCursor('abc', tokens);
      expect(cursor.getCurrentToken()).toEqual({ value: eof, index: -1 });
    });
  });

  describe('advance', () => {
    it('advances by one token by default', () => {
      const cursor = new ParserCursor('abc', tokens);
      cursor.advance();
      expect(cursor.getCurrentToken()).toEqual({ value: tokens[0], index: 0 });
    });

    it('advances by a given number of tokens', () => {
      const cursor = new ParserCursor('abc', tokens);
      cursor.advance(2);
      expect(cursor.getCurrentToken()).toEqual({ value: tokens[1], index: 1 });
    });

    it('throws when advancing by less than one token', () => {
      const cursor = new ParserCursor('abc', tokens);
      expect(() => cursor.advance(0)).toThrow();
    });

    it('moves to EOF when advancing past the last token', () => {
      const cursor = new ParserCursor('abc', tokens);
      cursor.advance(4);
      expect(cursor.getCurrentToken()).toEqual({ value: eof, index: -1 });
    });
  });

  describe('peek', () => {
    it('peeks the next token with no arguments', () => {
      const cursor = new ParserCursor('abc', tokens);
      expect(cursor.peek()).toBe(tokens[0]);
    });

    it('peeks with an offset via the options-only overload', () => {
      const cursor = new ParserCursor('abc', tokens);
      expect(cursor.peek({ offset: 1 })).toBe(tokens[1]);
    });

    it('peeks a single token explicitly, with and without offset', () => {
      const cursor = new ParserCursor('abc', tokens);
      expect(cursor.peek(1)).toBe(tokens[0]);
      expect(cursor.peek(1, { offset: 2 })).toBe(tokens[2]);
    });

    it('peeks multiple tokens ahead', () => {
      const cursor = new ParserCursor('abc', tokens);
      expect(cursor.peek(2)).toEqual([tokens[0], tokens[1]]);
    });

    it('returns EOF tokens when peeking past the end', () => {
      const cursor = new ParserCursor('abc', tokens);
      expect(cursor.peek({ offset: 5 })).toEqual(eof);
      expect(cursor.peek(4)).toEqual([tokens[0], tokens[1], tokens[2], eof]);
    });
  });
});
