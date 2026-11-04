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

  it('keeps line breaks, reading CR LF and a lone CR as LF', () => {
    const cursor = new LexerCursor('he\nl\r\nl\ro<div>');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.TAG_OPEN_NAME,
      tokens: [{ type: TokenType.TEXT, parts: ['he\nl\nl\no'] }]
    });
  });

  it('keeps a CR ending the input as LF', () => {
    const cursor = new LexerCursor('hello\r');
    expect(lexText(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.TEXT, parts: ['hello\n'] }]
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

  describe('whitespace between inline nodes', () => {
    const after = (type: TokenType): LexerTransitionFunctionContext => ({ history: [], tokens: [{ type, parts: [], span: { start: 0, end: 1 } } as never] });

    it.each([
      ['two interpolations', TokenType.INTERPOLATION_EXPRESSION, ' {b}'],
      ['an interpolation and an element', TokenType.INTERPOLATION_EXPRESSION, ' <b>'],
      ['a closed element and an interpolation', TokenType.TAG_CLOSE_NAME, ' {b}'],
      ['a self-closed element and an element', TokenType.TAG_SELF_CLOSE, '\t<b>']
    ])('keeps the whitespace separating %s on the same line', (_name, previous, input) => {
      expect(lexInput(input, after(previous)).tokens).toEqual([{ type: TokenType.TEXT, parts: [input[0]] }]);
    });

    it.each([
      ['it holds a line break', TokenType.INTERPOLATION_EXPRESSION, ' \n {b}'],
      ['it follows the start of an element', TokenType.TAG_OPEN_END, ' {b}'],
      ['it follows a block', TokenType.BLOCK_CLOSE, ' <b>'],
      ['it precedes a closing tag', TokenType.INTERPOLATION_EXPRESSION, ' </p>'],
      ['it precedes a flow-control keyword', TokenType.INTERPOLATION_EXPRESSION, ' @if']
    ])('drops the whitespace when %s', (_name, previous, input) => {
      expect(lexInput(input, after(previous)).tokens).toBeUndefined();
    });

    it('drops the whitespace at the start of the template', () => {
      expect(lexInput(' {b}', context).tokens).toBeUndefined();
    });
  });
});

/**
 * Runs `lexText` over the input.
 */
function lexInput(input: string, lexerContext: LexerTransitionFunctionContext) {
  return lexText(new LexerCursor(input), lexerContext);
}
