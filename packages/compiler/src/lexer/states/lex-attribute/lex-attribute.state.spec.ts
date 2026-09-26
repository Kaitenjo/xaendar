import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexAttribute } from './lex-attribute.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const dynamicBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_BODY, LexerState.DYNAMIC_BINDING_START, LexerState.ATTRIBUTE],
  tokens: []
};

describe('lexAttribute', () => {
  it('emits a value-less attribute terminated by a space', () => {
    const cursor = new LexerCursor('disabled class="x">');
    expect(lexAttribute(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['disabled'] }]
    });
  });

  it('emits a value-less attribute terminated directly by >', () => {
    const cursor = new LexerCursor('disabled>');
    expect(lexAttribute(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['disabled'] }]
    });
  });

  it('emits a value-less attribute terminated by /', () => {
    const cursor = new LexerCursor('disabled/>');
    expect(lexAttribute(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['disabled'] }]
    });
  });

  it('transitions to DYNAMIC_BINDING_BODY when nested inside a dynamic binding (space terminator)', () => {
    const cursor = new LexerCursor('disabled ');
    expect(lexAttribute(cursor, dynamicBindingContext).state).toBe(LexerState.DYNAMIC_BINDING_BODY);
  });

  it('transitions to DYNAMIC_BINDING_BODY when nested inside a dynamic binding (> terminator)', () => {
    const cursor = new LexerCursor('disabled>');
    expect(lexAttribute(cursor, dynamicBindingContext).state).toBe(LexerState.DYNAMIC_BINDING_BODY);
  });

  it('starts an attribute value after = and consumes the opening quote', () => {
    const cursor = new LexerCursor('class="foo">');
    expect(lexAttribute(cursor, context)).toEqual({
      state: LexerState.ATTRIBUTE_VALUE,
      pushState: true,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['class'] }]
    });
  });

  it('transitions to INTERPOLATION when the value starts with {', () => {
    const cursor = new LexerCursor('class="{value}">');
    expect(lexAttribute(cursor, context)).toEqual({
      state: LexerState.INTERPOLATION,
      pushState: true,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['class'] }]
    });
  });

  it('throws when = appears before any attribute name', () => {
    const cursor = new LexerCursor('="foo">');
    expect(() => lexAttribute(cursor, context)).toThrow('Attribute cannot start with \'=\'');
  });

  it('throws when the attribute value does not start with double quotes', () => {
    const cursor = new LexerCursor('class=foo>');
    expect(() => lexAttribute(cursor, context)).toThrow('Attribute value must start with double quotes \'"\'');
  });

  it('throws when the attribute name starts with a double quote', () => {
    const cursor = new LexerCursor('"foo">');
    expect(() => lexAttribute(cursor, context)).toThrow('Attribute cannot start with \' or \"');
  });

  it('throws when the attribute name starts with a single quote', () => {
    const cursor = new LexerCursor('\'foo\'>');
    expect(() => lexAttribute(cursor, context)).toThrow('Attribute cannot start with \' or \"');
  });

  it('treats a quote as a literal character once the attribute name has started', () => {
    const cursor = new LexerCursor('a"b>');
    expect(lexAttribute(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['a"b'] }]
    });
  });
});
