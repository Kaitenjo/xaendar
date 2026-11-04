import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexFlowControlBlock } from './lex-flow-control-block.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexFlowControlBlock', () => {
  it('consumes the opening brace and emits BLOCK_OPEN', () => {
    const cursor = new LexerCursor('{content}');
    expect(lexFlowControlBlock(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.BLOCK_OPEN }],
      pushState: true
    });
  });

  it('transitions to TEXT for a block opened in the content of a block itself', () => {
    const blockContext: LexerTransitionFunctionContext = { history: [LexerState.FLOW_CONTROL_BLOCK], tokens: [] };
    expect(lexFlowControlBlock(new LexerCursor('{content}'), blockContext).state).toBe(LexerState.TEXT);
  });

  it.each([
    ['directly in the tag body', [LexerState.TAG_OPEN_NAME]],
    ['in a directive', [LexerState.TAG_OPEN_NAME, LexerState.DIRECTIVE]],
    ['in a block of another conditional binding', [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK]],
    ['in a tag declared in the content of a block', [LexerState.FLOW_CONTROL_BLOCK, LexerState.TAG_OPEN_NAME]]
  ])('transitions to CONDITIONAL_BINDING_BODY for a block opened among the bindings of a tag, %s', (_description, history) => {
    expect(lexFlowControlBlock(new LexerCursor('{title="x"}'), { history, tokens: [] })).toEqual({
      state: LexerState.CONDITIONAL_BINDING_BODY,
      tokens: [{ type: TokenType.BLOCK_OPEN }],
      pushState: true
    });
  });

  it('skips leading whitespace before the opening brace', () => {
    const cursor = new LexerCursor('   {content}');
    expect(lexFlowControlBlock(cursor, context).tokens).toEqual([{ type: TokenType.BLOCK_OPEN }]);
  });

  it('throws when no opening brace is found', () => {
    const cursor = new LexerCursor('x');
    expect(() => lexFlowControlBlock(cursor, context)).toThrow("Expected '{' but got 'x'");
  });
});
