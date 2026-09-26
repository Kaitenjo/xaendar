import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexTagBody } from './lex-tag-body.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexTagBody', () => {
  it('transitions to EVENT on a plain @ binding', () => {
    const cursor = new LexerCursor('@click="onClick"');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.EVENT });
  });

  it('transitions to DYNAMIC_BINDING_START and consumes "@(" for a dynamic binding', () => {
    const cursor = new LexerCursor('@(bind(), other)');
    const result = lexTagBody(cursor, context);
    expect(result).toEqual({ state: LexerState.DYNAMIC_BINDING_START });
    expect(cursor.peek()).toBe('b'.charCodeAt(0));
  });

  it('skips whitespace and keeps scanning', () => {
    const cursor = new LexerCursor('   class="a">');
    const result = lexTagBody(cursor, context);
    expect(result).toEqual({ state: LexerState.ATTRIBUTE });
  });

  it('transitions to TAG_OPEN_END and pops state on >', () => {
    const cursor = new LexerCursor('>');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.TAG_OPEN_END, popState: true });
  });

  it('transitions to TAG_OPEN_END and pops state on /', () => {
    const cursor = new LexerCursor('/>');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.TAG_OPEN_END, popState: true });
  });

  it('transitions to ATTRIBUTE by default', () => {
    const cursor = new LexerCursor('disabled>');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });
});
