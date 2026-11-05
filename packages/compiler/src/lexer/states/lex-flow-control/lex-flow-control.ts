import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model.js';
import { LexerState } from '../../types/lexer-state.enum.js';
import { TokenType } from '../../types/token-type.enum.js';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type.js';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type.js';

/**
 * Dispatches on a `@keyword` to determine which flow-control directive begins here.
 * Recognises `@if`, `@for`, `@else`, `@switch`, `@case`, `@default`, `@hydrate`, `@client`, `@placeholder`, `@try`,
 * `@catch`, `@render`, `@let` and `@import`. A `@catch` reads the name of its error between parentheses, when it has
 * one, as `catch (error)` does in JavaScript.
 * Advances the cursor past the keyword and transitions to the appropriate next state.
 *
 * @param cursor - The lexer cursor positioned on the `@` character.
 * @param _context - Unused lexer context.
 * @returns Transition result with the matching flow-control token and next state.
 */
export function lexFlowControl(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let retVal!: LexerTransitionFunctionReturnType;

  // Consume '@' character
  cursor.advance();

  if (cursor.peekMatch('for ')) {
    cursor.advance(4);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.FOR
      }],
      pushState: true
    };
  } else if (cursor.peekMatch('if ')) {
    cursor.advance(2);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.IF
      }],
      pushState: true
    };
  } else if (cursor.peekMatch('else if ')) {
    cursor.advance(8);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.ELSE_IF
      }],
      pushState: true
    };
  } else if (cursor.peekMatch('else ')) {
    cursor.advance(5);
    retVal = {
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{
        type: TokenType.ELSE
      }]
    };
  } else if (cursor.peekMatch('switch ')) {
    cursor.advance(7);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.SWITCH
      }],
      pushState: true
    };
  } else if (cursor.peekMatch('case ')) {
    cursor.advance(5);
    retVal = {
      state: LexerState.CASE_FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.CASE
      }],
      pushState: true
    };
  } else if (cursor.peekMatch('default ')) {
    cursor.advance(8);
    retVal = {
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{
        type: TokenType.DEFAULT
      }]
    };
  } else if (cursor.peekMatch('hydrate ')) {
    cursor.advance(8);
    retVal = {
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{
        type: TokenType.HYDRATE
      }],
      pushState: true
    };
  } else if (cursor.peekMatch('client ')) {
    cursor.advance(7);
    retVal = {
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{
        type: TokenType.CLIENT
      }]
    };
  } else if (cursor.peekMatch('placeholder ')) {
    cursor.advance(12);
    retVal = {
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{
        type: TokenType.PLACEHOLDER
      }]
    };
  } else if (cursor.peekMatch('render ')) {
    cursor.advance(7);
    retVal = {
      state: LexerState.RENDER,
      tokens: [{
        type: TokenType.RENDER
      }]
    };
  } else if (cursor.peekMatch('let ')) {
    cursor.advance(4);
    retVal = {
      state: LexerState.LET,
      tokens: [{
        type: TokenType.LET
      }]
    };
  } else if (cursor.peekMatch('import ')) {
    cursor.advance(7);
    retVal = {
      state: LexerState.IMPORT
    };
  } else if (cursor.peekMatch('try ')) {
    cursor.advance(4);
    retVal = {
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{
        type: TokenType.TRY
      }]
    };
  } else if (cursor.peekMatch('catch ')) {
    cursor.advance(6);
    cursor.skipSpaces();
    // The name of the error, between parentheses, is optional
    retVal = cursor.peekMatch('(')
      ? { state: LexerState.FLOW_CONTROL_CONDITION, tokens: [{ type: TokenType.CATCH }], pushState: true }
      : { state: LexerState.FLOW_CONTROL_BLOCK, tokens: [{ type: TokenType.CATCH }] };
  } else {
    throw 'Unknown flow-control keyword';
  }

  return retVal
}