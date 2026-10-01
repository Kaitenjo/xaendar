import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { isConditionalBindingKeyword } from './conditional-binding.utils';

describe('isConditionalBindingKeyword', () => {
  it.each([
    '@if (cond()) { title="x" }',
    '@else if (cond()) { title="x" }',
    '@else { title="x" }',
    '@switch (mode()) { }',
    '@case (1) { title="x" }',
    '@default { title="x" }'
  ])('recognises %s', input => {
    expect(isConditionalBindingKeyword(new LexerCursor(input))).toBe(true);
  });

  it.each([
    ['a word starting with a keyword', '@iffy="x"'],
    ['a directive', '@@myDirective(display="block")'],
    ['a keyword declared outside of a tag only', '@for (item of items; track item) { }'],
    ['a keyword not followed by a space', '@if(cond()) { }']
  ])('does not recognise %s', (_description, input) => {
    expect(isConditionalBindingKeyword(new LexerCursor(input))).toBe(false);
  });

  it('does not consume the keyword', () => {
    const cursor = new LexerCursor('@if (cond()) { }');
    isConditionalBindingKeyword(cursor);
    expect(cursor.peek()).toBe('@'.charCodeAt(0));
  });

  it('does not fail when the input ends before the longest keyword could', () => {
    expect(isConditionalBindingKeyword(new LexerCursor('@a'))).toBe(false);
  });
});
