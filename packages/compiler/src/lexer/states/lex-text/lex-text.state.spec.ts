import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexText } from './lex-text.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexText', () => {
  it('emits accumulated text and transitions to TAG_OPEN_NAME before an opening tag', () => {
    const cursor = new LexerCursor('hello<div>');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.TAG_OPEN_NAME,
      tokens: [{ type: TokenType.TEXT, parts: ['hello'] }]
    });
  });

  it('transitions to TAG_CLOSE before a closing tag', () => {
    const cursor = new LexerCursor('hello</div>');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.TAG_CLOSE,
      tokens: [{ type: TokenType.TEXT, parts: ['hello'] }]
    });
  });

  it('transitions to INTERPOLATION and pushes state before {', () => {
    const cursor = new LexerCursor('hello{value}');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.INTERPOLATION,
      pushState: true,
      tokens: [{ type: TokenType.TEXT, parts: ['hello'] }]
    });
  });

  it('transitions to FLOW_CONTROL before @', () => {
    const cursor = new LexerCursor('hello@if');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL,
      tokens: [{ type: TokenType.TEXT, parts: ['hello'] }]
    });
  });

  it('emits BLOCK_CLOSE and pops state when } closes a flow-control block', () => {
    const cursor = new LexerCursor('hello}');
    const blockContext: LexerTransitionFunctionContext = { history: [LexerState.FLOW_CONTROL_BLOCK], tokens: [] };
    expect(lexText(cursor, blockContext)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.TEXT, parts: ['hello'] }, { type: TokenType.BLOCK_CLOSE }],
      popState: true
    });
  });

  it('emits only BLOCK_CLOSE when no text precedes the closing }', () => {
    const cursor = new LexerCursor('  }');
    const blockContext: LexerTransitionFunctionContext = { history: [LexerState.FLOW_CONTROL_BLOCK], tokens: [] };
    expect(lexText(cursor, blockContext)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.BLOCK_CLOSE }],
      popState: true
    });
  });

  it('treats } as literal text when not closing a flow-control block', () => {
    const cursor = new LexerCursor('hel}lo<div>');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.TAG_OPEN_NAME,
      tokens: [{ type: TokenType.TEXT, parts: ['hel}lo'] }]
    });
  });

  it('skips line feeds and carriage returns without including them in the text', () => {
    const cursor = new LexerCursor('he\nl\rlo<div>');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.TAG_OPEN_NAME,
      tokens: [{ type: TokenType.TEXT, parts: ['hello'] }]
    });
  });

  it('emits no TEXT token when a structural boundary is the very first character', () => {
    const cursor = new LexerCursor('<div>');
    expect(lexText(cursor, context)).toEqual({ state: LexerState.TAG_OPEN_NAME });
  });

  it('emits the accumulated text when the input ends mid-text (EOF)', () => {
    const cursor = new LexerCursor('hello');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.TEXT, parts: ['hello'] }]
    });
  });

  it('rethrows the EOF error when no text has been accumulated', () => {
    const cursor = new LexerCursor('');
    expect(() => lexText(cursor, context)).toThrow();
  });

  it('rethrows a non-EOF error encountered while reading', () => {
    const boom = new Error('boom');
    const fakeCursor = {
      peek: () => { throw boom; }
    } as unknown as LexerCursor;

    expect(() => lexText(fakeCursor, context)).toThrow(boom);
  });
});
