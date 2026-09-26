import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexDefaultFlowControlCondition } from './lex-default-flow-control-condition.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexDefaultFlowControlCondition', () => {
  it('emits the CONDITION token and transitions to FLOW_CONTROL_BLOCK', () => {
    const cursor = new LexerCursor('(x) {');
    expect(lexDefaultFlowControlCondition(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type: TokenType.CONDITION, parts: ['x'] }],
      popState: true
    });
  });
});
