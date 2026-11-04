import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexAttribute } from './lex-attribute.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };
const conditionalBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK],
  tokens: []
};
const directiveContext: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME, LexerState.DIRECTIVE],
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

  it.each([
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r']
  ])('emits a value-less attribute terminated by %s, consuming it', (_description, whitespace) => {
    const cursor = new LexerCursor(`disabled${whitespace}class="x">`);
    expect(lexAttribute(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['disabled'] }]
    });
    expect(cursor.peek()).toBe('c'.charCodeAt(0));
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

  it('transitions to CONDITIONAL_BINDING_BODY when nested inside a conditional binding (space terminator)', () => {
    const cursor = new LexerCursor('disabled ');
    expect(lexAttribute(cursor, conditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('transitions to CONDITIONAL_BINDING_BODY when nested inside a conditional binding (> terminator)', () => {
    const cursor = new LexerCursor('disabled>');
    expect(lexAttribute(cursor, conditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('transitions to DIRECTIVE_BODY when nested inside a directive', () => {
    const cursor = new LexerCursor('disabled ');
    expect(lexAttribute(cursor, directiveContext).state).toBe(LexerState.DIRECTIVE_BODY);
  });

  it('stops before the } closing a block of a conditional binding', () => {
    const cursor = new LexerCursor('disabled}');
    expect(lexAttribute(cursor, conditionalBindingContext)).toEqual({
      state: LexerState.CONDITIONAL_BINDING_BODY,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['disabled'] }]
    });
    expect(cursor.peek()).toBe('}'.charCodeAt(0));
  });

  it('stops before the ) closing a directive', () => {
    const cursor = new LexerCursor('disabled)');
    expect(lexAttribute(cursor, directiveContext)).toEqual({
      state: LexerState.DIRECTIVE_BODY,
      tokens: [{ type: TokenType.ATTRIBUTE, parts: ['disabled'] }]
    });
    expect(cursor.peek()).toBe(')'.charCodeAt(0));
  });

  it.each([
    ['in the tag body', context],
    ['in a block of a conditional binding', conditionalBindingContext]
  ])('throws on ) outside of a directive, %s', (_description, outerContext) => {
    expect(() => lexAttribute(new LexerCursor('a)b>'), outerContext)).toThrow('Unexpected \')\': there is no directive to close');
  });

  it.each([
    ['in the tag body', context],
    ['in a directive', directiveContext]
  ])('throws on } outside of a conditional binding, %s', (_description, outerContext) => {
    expect(() => lexAttribute(new LexerCursor('a}b>'), outerContext)).toThrow('Unexpected \'}\': there is no conditional binding to close');
  });

  it.each([
    ['in the tag body', context],
    ['in a directive', directiveContext],
    ['in a block of a conditional binding', conditionalBindingContext]
  ])('throws on ( inside the attribute name, %s, i.e. an event binding not separated by a space', (_description, outerContext) => {
    expect(() => lexAttribute(new LexerCursor('disabled(input)="f()">'), outerContext)).toThrow('Unexpected \'(\' in attribute name');
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
