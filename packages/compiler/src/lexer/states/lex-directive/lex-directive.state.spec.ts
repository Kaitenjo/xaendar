import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexDirective } from './lex-directive.state';

const context: LexerTransitionFunctionContext = { history: [LexerState.TAG_OPEN_NAME], tokens: [] };
const conditionalBindingContext: LexerTransitionFunctionContext = { history: [LexerState.TAG_OPEN_NAME, LexerState.CONDITIONAL_BINDING_START], tokens: [] };

/**
 * Creates a cursor positioned right after the `@@` of the given input, as the tag body leaves it.
 */
function afterAtSigns(input: string): LexerCursor {
  const cursor = new LexerCursor(input);
  cursor.advance(2);
  return cursor;
}

describe('lexDirective', () => {
  it('emits the directive and opens its body on (', () => {
    const cursor = afterAtSigns('@@myDirective(display="block")');
    expect(lexDirective(cursor, context)).toEqual({
      state: LexerState.DIRECTIVE_BODY,
      tokens: [{ type: TokenType.DIRECTIVE, parts: ['myDirective'] }],
      pushState: true
    });
    expect(cursor.peek()).toBe('d'.charCodeAt(0));
  });

  it('emits the directive and its closure when declared without bindings and followed by a space', () => {
    const cursor = afterAtSigns('@@myDirective class="a"');
    expect(lexDirective(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [
        { type: TokenType.DIRECTIVE, parts: ['myDirective'] },
        { type: TokenType.DIRECTIVE_CLOSE }
      ]
    });
    expect(cursor.peek()).toBe(' '.charCodeAt(0));
  });

  it('emits the directive and its closure when declared without bindings and followed by >', () => {
    const cursor = afterAtSigns('@@myDirective>');
    expect(lexDirective(cursor, context).tokens?.map(token => token.type)).toEqual([TokenType.DIRECTIVE, TokenType.DIRECTIVE_CLOSE]);
  });

  it('emits the directive and its closure when declared without bindings and followed by /', () => {
    const cursor = afterAtSigns('@@myDirective/>');
    expect(lexDirective(cursor, context).tokens?.map(token => token.type)).toEqual([TokenType.DIRECTIVE, TokenType.DIRECTIVE_CLOSE]);
  });

  it('goes back to CONDITIONAL_BINDING_BODY when declared without bindings inside a conditional binding', () => {
    const cursor = afterAtSigns('@@myDirective class="a")');
    expect(lexDirective(cursor, conditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('leaves the ) closing the conditional binding it is declared in to the conditional binding body', () => {
    const cursor = afterAtSigns('@@myDirective)');
    expect(lexDirective(cursor, conditionalBindingContext)).toEqual({
      state: LexerState.CONDITIONAL_BINDING_BODY,
      tokens: [
        { type: TokenType.DIRECTIVE, parts: ['myDirective'] },
        { type: TokenType.DIRECTIVE_CLOSE }
      ]
    });
    expect(cursor.peek()).toBe(')'.charCodeAt(0));
  });

  it('throws on ) outside of a conditional binding', () => {
    expect(() => lexDirective(afterAtSigns('@@myDirective)'), context)).toThrow('Unexpected \')\': there is no conditional binding or directive to close');
  });

  it('throws when the selector is empty', () => {
    expect(() => lexDirective(afterAtSigns('@@(display="block")'), context)).toThrow('Directive selector cannot be empty');
  });

  it('throws when the selector is empty and the directive has no bindings', () => {
    expect(() => lexDirective(afterAtSigns('@@ class="a"'), context)).toThrow('Directive selector cannot be empty');
  });

  it('throws when the bindings are not declared between parentheses', () => {
    expect(() => lexDirective(afterAtSigns('@@myDirective="block"'), context)).toThrow('Directive bindings must be declared between parentheses');
  });
});
