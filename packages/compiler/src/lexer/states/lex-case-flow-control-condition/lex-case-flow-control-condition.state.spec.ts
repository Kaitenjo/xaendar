import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexCaseFlowControlCondition } from './lex-case-flow-control-condition.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexCaseFlowControlCondition', () => {
  it('transitions back to FLOW_CONTROL when another @case follows', () => {
    const cursor = new LexerCursor('(x) @case (y)');
    expect(lexCaseFlowControlCondition(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL,
      tokens: [{ type: TokenType.CONDITION, parts: ['x'] }],
      popState: true
    });
  });

  it('transitions to FLOW_CONTROL_BLOCK when no further @case follows', () => {
    const cursor = new LexerCursor('(x) {zzzzz');
    expect(lexCaseFlowControlCondition(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type: TokenType.CONDITION, parts: ['x'] }],
      popState: true
    });
  });
});
