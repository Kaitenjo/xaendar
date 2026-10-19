import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexElementRef } from './lex-element-ref.state';

const context: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME],
  tokens: [{ type: TokenType.TAG_OPEN_NAME, parts: ['input'], span: { start: 0, end: 6 } }]
};

/**
 * Creates a cursor positioned right after the `#` of the given input, as the tag body leaves it.
 */
function afterHash(input: string): LexerCursor {
  const cursor = new LexerCursor(input);
  cursor.advance();
  return cursor;
}

describe('lexElementRef', () => {
  it.each([
    ['a space', ' '],
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r'],
    ['>', '>'],
    ['/', '/']
  ])('emits the ref and goes back to TAG_BODY on %s, leaving it to the tag body', (_description, next) => {
    const cursor = afterHash(`#name${next}type="text"`);
    expect(lexElementRef(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.ELEMENT_REF, parts: ['name'] }]
    });
    expect(cursor.peek()).toBe(next.charCodeAt(0));
  });

  it('throws for a ref followed by parentheses', () => {
    expect(() => lexElementRef(afterHash('#row(item: Item)>'), context)).toThrow('An element ref is just #name, without parentheses');
  });

  it('throws for a ref given a value', () => {
    expect(() => lexElementRef(afterHash('#name="field">'), context)).toThrow('An element ref takes no value');
  });

  it('throws for a ref without a name', () => {
    expect(() => lexElementRef(afterHash('# type="text"'), context)).toThrow('An element ref needs a name');
  });
});
