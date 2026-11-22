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

    it('returns false for a string pattern longer than what is left of the input', () => {
      const cursor = new LexerCursor('he');
      expect(cursor.peekMatch('hello')).toBe(false);
    });

    it('skips the comments before a string pattern', () => {
      const cursor = new LexerCursor('<!--c-->hello');
      expect(cursor.peekMatch('hel')).toBe(true);
    });

    it('matches a sticky RegExp pattern against the upcoming characters', () => {
      const cursor = new LexerCursor('123abc');
      expect(cursor.peekMatch(/\d+/y)).toBe(true);
    });

    it('returns false when a RegExp pattern does not match', () => {
      const cursor = new LexerCursor('abc123');
      expect(cursor.peekMatch(/\d+/y)).toBe(false);
    });

    it('matches a RegExp pattern from the cursor, its lookaheads reading the input up to its end', () => {
      const cursor = new LexerCursor('1 '.concat(' '.repeat(1000), ';'));
      expect(cursor.peekMatch(/ *;/y)).toBe(false);
      cursor.advance();
      expect(cursor.peekMatch(/ *;/y)).toBe(true);
      expect(cursor.peekMatch(/ *(?=;)/y)).toBe(true);
    });

    it('returns false for a RegExp pattern at the end of the input', () => {
      const cursor = new LexerCursor('a');
      cursor.advance();
      expect(cursor.peekMatch(/[a-z]/y)).toBe(false);
    });

    it('rejects a RegExp pattern that is not sticky, which would match anywhere after the cursor', () => {
      const cursor = new LexerCursor('abc123');
      expect(() => cursor.peekMatch(/\d+/)).toThrow('/\\d+/ must be sticky (y flag) to match from the cursor');
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

    it('peeks multiple characters after an offset, skipping the ones before it', () => {
      const cursor = new LexerCursor('abcdef');
      expect(cursor.peek(2, { offset: 2 })).toEqual(['c', 'd'].map(c => c.charCodeAt(0)));
      cursor.advance();
      expect(cursor.peek(3, { offset: 1 })).toEqual(['c', 'd', 'e'].map(c => c.charCodeAt(0)));
    });

    it('peeks the same character again at the same position', () => {
      const cursor = new LexerCursor('abc');
      expect(cursor.peek()).toBe(cursor.peek());
    });

    it('peeks the characters after the ones the cursor advances past', () => {
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

    it('throws the same end-of-file error for every cursor, its stack trace never read', () => {
      const errors = ['a', 'b'].map(input => {
        const cursor = new LexerCursor(input);
        cursor.advance();
        try {
          cursor.peek();
        } catch (err) {
          return err;
        }

        return undefined;
      });

      expect(errors[0]).toBeInstanceOf(Error);
      expect(errors[0]).toBe(errors[1]);
    });
  });

  describe('peekMatchAfterSpaces', () => {
    it('matches a text after the whitespace following the current position, without advancing', () => {
      const cursor = new LexerCursor(' \t\r\n(idle)');
      expect(cursor.peekMatchAfterSpaces('(')).toBe(true);
      expect(cursor.currentChar.index).toBe(-1);
      expect(new LexerCursor('(idle)').peekMatchAfterSpaces('(')).toBe(true);
    });

    it('returns false when the text does not follow, at the end of the input too', () => {
      expect(new LexerCursor('  {').peekMatchAfterSpaces('(')).toBe(false);
      expect(new LexerCursor('  ').peekMatchAfterSpaces('(')).toBe(false);
    });
  });

  describe('peekKeywordAfterSpaces', () => {
    it('matches a keyword between whitespace after the current position, without advancing', () => {
      const cursor = new LexerCursor(' as string');
      expect(cursor.peekKeywordAfterSpaces('as')).toBe(true);
      expect(cursor.currentChar.index).toBe(-1);
      expect(new LexerCursor('\r\n\t as\nstring').peekKeywordAfterSpaces('as')).toBe(true);
    });

    it('returns false without whitespace before or after the keyword, or at the end of the input', () => {
      expect(new LexerCursor('as string').peekKeywordAfterSpaces('as')).toBe(false);
      expect(new LexerCursor(' asset').peekKeywordAfterSpaces('as')).toBe(false);
      expect(new LexerCursor(' as').peekKeywordAfterSpaces('as')).toBe(false);
      expect(new LexerCursor(' is string').peekKeywordAfterSpaces('as')).toBe(false);
      expect(new LexerCursor('  ').peekKeywordAfterSpaces('as')).toBe(false);
    });
  });

  describe('skipSpaces', () => {
    it('skips spaces, tabs, line feeds and carriage returns', () => {
      const cursor = new LexerCursor(' \t\n\r x');
      cursor.skipSpaces();
      expect(cursor.peek()).toBe('x'.charCodeAt(0));
    });

    it.each([
      ['a tab', '\t'],
      ['a line feed', '\n'],
      ['a carriage return', '\r']
    ])('skips %s on its own', (_description, whitespace) => {
      const cursor = new LexerCursor(`${whitespace}x`);
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

    it('skips consecutive comments', () => {
      const cursor = new LexerCursor('<!--a--><!--b-->x');
      expect(cursor.peek()).toBe('x'.charCodeAt(0));
    });

    it('peeks a comment as written when peeking verbatim, then reaches the end of the input', () => {
      const cursor = new LexerCursor('<!--');
      expect(cursor.peekVerbatim()).toBe('<'.charCodeAt(0));
      cursor.advance(4);
      expect(() => cursor.peekVerbatim()).toThrow(expect.objectContaining({ cause: endOfFile }));
    });

    it('skips a comment closing the input, then reaches its end', () => {
      const cursor = new LexerCursor('a<!---->');
      cursor.advance();
      expect(() => cursor.peek()).toThrow(expect.objectContaining({ cause: endOfFile }));
    });

    it('leaves the cursor untouched when no comment is present', () => {
      const cursor = new LexerCursor('abcdefgh');
      expect(cursor.peek()).toBe('a'.charCodeAt(0));
      expect(cursor.currentChar.index).toBe(-1);
    });

    it.each([
      ['an unclosed comment', '<!-- unterminated'],
      ['an unclosed comment near the end of the input', 'a<!--'],
      ['a comment whose closing overlaps its opening', '<!-->']
    ])('throws for %s', (_name, input) => {
      const cursor = new LexerCursor(input);
      expect(() => {
        cursor.peek();
        cursor.advance();
        cursor.peek();
      }).toThrow('Comment never closed: \'<!--\' without \'-->\'');
    });
  });
});
