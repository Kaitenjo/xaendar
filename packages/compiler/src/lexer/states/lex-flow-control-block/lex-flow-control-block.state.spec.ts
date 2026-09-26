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

  it('skips leading whitespace before the opening brace', () => {
    const cursor = new LexerCursor('   {content}');
    expect(lexFlowControlBlock(cursor, context).tokens).toEqual([{ type: TokenType.BLOCK_OPEN }]);
  });

  it('throws when no opening brace is found', () => {
    const cursor = new LexerCursor('x');
    expect(() => lexFlowControlBlock(cursor, context)).toThrow("Expected '{' but got 'x'");
  });
});
