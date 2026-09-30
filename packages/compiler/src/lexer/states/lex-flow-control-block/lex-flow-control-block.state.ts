import { LEFT_BRACE } from '../../../costants/chars.constants.js';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model.js';
import { LexerState } from '../../types/lexer-state.enum.js';
import { TokenType } from '../../types/token-type.enum.js';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type.js';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type.js';

/**
 * Consumes the opening `{` of a flow-control block body,
 * skipping any leading whitespace before it.
 *
 * Emits a BLOCK_OPEN token and transitions to TEXT, pushing FLOW_CONTROL_BLOCK
 * onto the state stack so that `consumeText` later recognises the matching `}`
 * as a BLOCK_CLOSE rather than an interpolation boundary.
 *
 * A block opened among the bindings of a tag belongs to a conditional binding: it holds bindings
 * rather than template content, so it transitions to CONDITIONAL_BINDING_BODY instead, which
 * recognises the matching `}` the same way.
 *
 * Used by: `@if`, `@for`, `@switch`, `@case`, `@else`, `@default`.
 *
 * @param cursor - The lexer cursor positioned before the opening `{`.
 * @param context - The lexer context, whose history tells whether the block is opened among the bindings of a tag.
 * @returns Transition result with the BLOCK_OPEN token and the state lexing the content of the block.
 * @throws If the next non-space character is not `{`.
 */
export function lexFlowControlBlock(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  cursor.skipSpaces();

  if (cursor.peek() !== LEFT_BRACE) {
    throw `Expected '{' but got '${String.fromCharCode(cursor.peek())}'`;
  }

  // consume '{'
  cursor.advance();

  return {
    // The state opening a tag stays on the state stack until the tag is closed.
    state: context.history.includes(LexerState.TAG_OPEN_NAME) ? LexerState.CONDITIONAL_BINDING_BODY : LexerState.TEXT,
    tokens: [{ type: TokenType.BLOCK_OPEN }],
    pushState: true
  };
}
