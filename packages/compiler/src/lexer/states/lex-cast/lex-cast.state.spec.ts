import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { Token } from '../../types/token.type';
import type { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexCast } from './lex-cast.state';

const span = { start: 0, end: 0 };
const interpolation: Token = { type: TokenType.INTERPOLATION_EXPRESSION, parts: ['value()'], span };
const parameter: Token = { type: TokenType.EVENT_PARAMETER, parts: ['$event'], span };
const inInterpolation = (...history: LexerState[]): LexerTransitionFunctionContext => ({ history, tokens: [interpolation] });
const inParameter = (...history: LexerState[]): LexerTransitionFunctionContext => ({ history, tokens: [parameter] });
const cast = (type: string) => [{ type: TokenType.CAST, parts: [type] }];

describe('lexCast', () => {
  describe('closing an interpolation', () => {
    it('reads the type up to the closing brace and closes the interpolation in the text', () => {
      const cursor = new LexerCursor(' as Map<string, { a: number }>  }<');

      expect(lexCast(cursor, inInterpolation(LexerState.TEXT))).toEqual({ state: LexerState.TEXT, tokens: cast('Map<string, { a: number }>'), popState: true });
      expect(cursor.currentChar.value).toBe('}');
    });

    it('closes the value of an attribute', () => {
      const cursor = new LexerCursor('\n  as\n  string}" ');

      expect(lexCast(cursor, inInterpolation(LexerState.DIRECTIVE, LexerState.ATTRIBUTE))).toEqual({ state: LexerState.DIRECTIVE_BODY, tokens: cast('string'), popState: true });
      expect(cursor.currentChar.value).toBe('"');
    });

    it('throws when the type is blank', () => {
      expect(() => lexCast(new LexerCursor(' as  }'), inInterpolation(LexerState.TEXT))).toThrow('A cast needs a type after "as", e.g. { value() as string }');
    });
  });

  describe('closing a parameter of an event handler', () => {
    it('reads the type up to the comma, and transitions to the next parameter', () => {
      const cursor = new LexerCursor(' as MouseEvent,  item())"');

      expect(lexCast(cursor, inParameter())).toEqual({ state: LexerState.EVENT_PARAMETER, tokens: cast('MouseEvent') });
      expect(cursor.peekMatch('  item())"')).toBe(true);
    });

    it('reads the type up to the parenthesis, and closes the event binding', () => {
      const cursor = new LexerCursor(' as MouseEvent )" ');

      expect(lexCast(cursor, inParameter())).toEqual({ state: LexerState.TAG_BODY, tokens: cast('MouseEvent') });
      expect(cursor.currentChar.value).toBe('"');
      expect(lexCast(new LexerCursor(' as MouseEvent)"'), inParameter(LexerState.FLOW_CONTROL_BLOCK)).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
    });

    it.each([
      ['type arguments', 'Map<string, Array<number>>'],
      ['a function type', '(first: number, second: string) => void'],
      ['a generic function type', 'Array<(value: number) => void>'],
      ['a tuple', '[string, number]'],
      ['an object type', '{ id: string, label: string }'],
      ['string literal types', '\'a,b\' | "c)d"'],
      ['an escaped quote', '\'it\\\'s, )\''],
      ['a template literal type', '`a,${string})`']
    ])('reads the commas and the parentheses of %s as part of the type', (_name, type) => {
      expect(lexCast(new LexerCursor(` as ${type})"`), inParameter()).tokens).toEqual(cast(type));
    });

    it('throws when the type is blank', () => {
      expect(() => lexCast(new LexerCursor(' as )"'), inParameter())).toThrow('A cast needs a type after "as"');
    });

    it('throws when the event binding is not closed by a double quote', () => {
      expect(() => lexCast(new LexerCursor(' as MouseEvent) '), inParameter())).toThrow('Event must be included in Double Quotes');
    });
  });
});
