import { describe, expect, it } from 'vitest';
import { endOfFile, LexerCursor } from './lexer-cursor.model';

describe('LexerCursor', () => {
  describe('advance', () => {
    it('advances by one character by default', () => {
      const cursor = new LexerCursor('abc');
      cursor.advance();
      expect(cursor.currentChar.index).toBe(0);
      expect(cursor.currentChar.value).toBe('a');
      expect(cursor.currentChar.code).toBe('a'.charCodeAt(0));
    });

    it('advances by a given number of characters', () => {
      const cursor = new LexerCursor('abcdef');
      cursor.advance(3);
      expect(cursor.currentChar.index).toBe(2);
      expect(cursor.currentChar.value).toBe('c');
    });

    it('throws when advancing by less than one character', () => {
      const cursor = new LexerCursor('abc');
      expect(() => cursor.advance(0)).toThrow();
      expect(() => cursor.advance(-1)).toThrow();
    });

    it('throws an EOF error and resets the current character when advancing past the end', () => {
      const cursor = new LexerCursor('a');
      cursor.advance();

      let caught: unknown;
      try {
        cursor.advance();
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).cause).toBe(endOfFile);
      expect(cursor.currentChar.index).toBe(-1);
      expect(cursor.currentChar.value).toBe('');
      expect(cursor.currentChar.code).toBe(0);
    });
  });

  describe('peekMatch', () => {
    it('matches a string pattern against the upcoming characters', () => {
      const cursor = new LexerCursor('hello');
      expect(cursor.peekMatch('hel')).toBe(true);
    });

    it('returns false when a string pattern does not match', () => {
      const cursor = new LexerCursor('hello');
      expect(cursor.peekMatch('xyz')).toBe(false);
    });

    it('matches a RegExp pattern against the upcoming characters', () => {
      const cursor = new LexerCursor('123abc');
      expect(cursor.peekMatch(/^\d+/, 3)).toBe(true);
    });

    it('returns false when a RegExp pattern does not match', () => {
      const cursor = new LexerCursor('abc123');
      expect(cursor.peekMatch(/^\d+/, 3)).toBe(false);
    });
  });

  describe('peek', () => {
    it('peeks the next single character with no arguments', () => {
      const cursor = new LexerCursor('abc');
      expect(cursor.peek()).toBe('a'.charCodeAt(0));
    });

    it('peeks with an offset via the options-only overload', () => {
      const cursor = new LexerCursor('abc');
      expect(cursor.peek({ offset: 1 })).toBe('b'.charCodeAt(0));
    });

    it('defaults the offset to 0 when the options object has none', () => {
      const cursor = new LexerCursor('abc');
      expect(cursor.peek({})).toBe('a'.charCodeAt(0));
    });

    it('peeks a single character explicitly', () => {
      const cursor = new LexerCursor('abc');
      expect(cursor.peek(1)).toBe('a'.charCodeAt(0));
    });

    it('peeks a single character with an explicit offset', () => {
      const cursor = new LexerCursor('abc');
      expect(cursor.peek(1, { offset: 2 })).toBe('c'.charCodeAt(0));
    });

    it('peeks multiple characters ahead', () => {
      const cursor = new LexerCursor('abcdef');
      expect(cursor.peek(3)).toEqual(['a', 'b', 'c'].map(c => c.charCodeAt(0)));
    });

    it('peeks multiple characters with an offset', () => {
      const cursor = new LexerCursor('abcdef');
      expect(cursor.peek(2, { offset: 2 })).toEqual(['a', 'b', 'c', 'd'].map(c => c.charCodeAt(0)));
    });

    it('caches repeated peeks at the same position', () => {
      const cursor = new LexerCursor('abc');
      expect(cursor.peek()).toBe(cursor.peek());
    });

    it('invalidates cached positions once the cursor advances past them', () => {
      const cursor = new LexerCursor('abcdef');
      cursor.peek(3);
      cursor.advance(2);
      expect(cursor.peek()).toBe('c'.charCodeAt(0));
    });

    it('throws an EOF error when peeking past the end of the input', () => {
      const cursor = new LexerCursor('ab');
      cursor.advance();
      cursor.advance();

      let caught: unknown;
      try {
        cursor.peek();
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).cause).toBe(endOfFile);
    });
  });

  describe('skipSpaces', () => {
    it('skips spaces, line feeds and carriage returns', () => {
      const cursor = new LexerCursor(' \n\r x');
      cursor.skipSpaces();
      expect(cursor.peek()).toBe('x'.charCodeAt(0));
    });

    it('does nothing when the next character is not a space', () => {
      const cursor = new LexerCursor('x');
      cursor.skipSpaces();
      expect(cursor.peek()).toBe('x'.charCodeAt(0));
    });
  });

  describe('comment consumption', () => {
    it('transparently skips an HTML comment encountered while peeking', () => {
      const cursor = new LexerCursor('<!--c-->x');
      expect(cursor.peek()).toBe('x'.charCodeAt(0));
    });

    it('does not attempt comment consumption near the end of the input', () => {
      const cursor = new LexerCursor('abcdefghij');
      cursor.advance(6);
      expect(cursor.peek()).toBe('g'.charCodeAt(0));
    });

    it('leaves the cursor untouched when the guard allows a check but no comment is present', () => {
      const cursor = new LexerCursor('abcdefgh');
      expect(cursor.peek()).toBe('a'.charCodeAt(0));
    });

    it('throws an EOF error for an unterminated comment', () => {
      const cursor = new LexerCursor('<!-- unterminated');
      expect(() => cursor.peek()).toThrow();
    });
  });
});
