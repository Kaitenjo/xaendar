import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model.js';
import { LexerState } from '../../types/lexer-state.enum.js';
import { TokenType } from '../../types/token-type.enum.js';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type.js';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type.js';

/**
 * Dispatches on a `@keyword` to determine which flow-control directive begins here.
 * Recognises `@if`, `@for`, `@empty`, `@else`, `@switch`, `@case`, `@default`, `@hydrate`, `@client`, `@placeholder`, `@try`,
 * `@catch`, `@defer`, `@loading`, `@error`, `@render`, `@let` and `@import`. The parentheses following `@catch`, `@error`,
 * `@defer`, `@hydrate`, `@placeholder`, `@loading` and `@empty` are optional (see {@link lexBlockWithParameters}), and
 * `@default never;` is a statement without block (see {@link lexDefault}).
 * Advances the cursor past the keyword and transitions to the appropriate next state.
 *
 * @param cursor - The lexer cursor positioned on the `@` character.
 * @param context - The lexer context, whose history tells whether a `@default never;` is declared among the bindings
 *   of a tag.
 * @returns Transition result with the matching flow-control token and next state.
 * @throws If the keyword is unknown, or `@default never` is not followed by `;`.
 */
export function lexFlowControl(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
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
  } else if (cursor.peekMatch('empty ')) {
    cursor.advance(6);
    // Read with its parentheses, if any, which the parser rejects: @empty takes no parameters
    retVal = lexBlockWithParameters(cursor, TokenType.EMPTY);
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
    retVal = lexDefault(cursor, context);
  } else if (cursor.peekMatch('hydrate ')) {
    cursor.advance(8);
    retVal = lexBlockWithParameters(cursor, TokenType.HYDRATE);
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
    retVal = lexBlockWithParameters(cursor, TokenType.PLACEHOLDER);
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
    retVal = lexBlockWithParameters(cursor, TokenType.CATCH);
  } else if (cursor.peekMatch('defer ')) {
    cursor.advance(6);
    retVal = lexBlockWithParameters(cursor, TokenType.DEFER);
  } else if (cursor.peekMatch('loading ')) {
    cursor.advance(8);
    retVal = lexBlockWithParameters(cursor, TokenType.LOADING);
  } else if (cursor.peekMatch('error ')) {
    cursor.advance(6);
    retVal = lexBlockWithParameters(cursor, TokenType.ERROR);
  } else {
    throw 'Unknown flow-control keyword';
  }

  return retVal
}

/**
 * Lexes what follows `@default`: the block of its branch, or `never;`, the statement of an exhaustive `@switch`, which
 * declares no branch and returns to the content, or to the bindings of the tag, holding the `@switch`.
 *
 * @param cursor - The lexer cursor positioned after `@default `.
 * @param context - The lexer context, whose history tells whether the `@switch` is declared among the bindings of a tag.
 * @returns Transition result with the DEFAULT token, flagged `never` for `@default never;`.
 * @throws If `@default never` is not followed by `;`.
 */
function lexDefault(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  if (!cursor.peekMatchAfterSpaces('never')) {
    return { state: LexerState.FLOW_CONTROL_BLOCK, tokens: [{ type: TokenType.DEFAULT }] };
  }

  cursor.skipSpaces();
  if (!cursor.peekMatch(/^never(?![\w$])/, 6)) {
    return { state: LexerState.FLOW_CONTROL_BLOCK, tokens: [{ type: TokenType.DEFAULT }] };
  }

  cursor.advance(5);
  if (!cursor.peekMatchAfterSpaces(';')) {
    throw '@default never declares no branch: end it with a semicolon, as in @default never;';
  }

  cursor.skipSpaces();
  // consume ';'
  cursor.advance();
  return {
    // The state opening a tag stays on the state stack until the tag is closed.
    state: context.history.includes(LexerState.TAG_OPEN_NAME) ? LexerState.CONDITIONAL_BINDING_BODY : LexerState.TEXT,
    tokens: [{ type: TokenType.DEFAULT, never: true }]
  };
}

/**
 * Lexes the keyword of a block whose parameters, between parentheses, are optional: the name of the error a `@catch` and
 * an `@error` receive, as `catch (error)` does in JavaScript, the triggers of a `@defer` and of a `@hydrate`, which wait
 * for `idle` without them, and the times of a `@placeholder` and of a `@loading`.
 *
 * @param cursor - The lexer cursor positioned after the keyword.
 * @param type - The token of the keyword.
 * @returns Transition result reading the parameters as a condition, when there are some, or the block.
 */
function lexBlockWithParameters(cursor: LexerCursor, type: TokenType.CATCH | TokenType.ERROR | TokenType.DEFER | TokenType.HYDRATE | TokenType.PLACEHOLDER | TokenType.LOADING | TokenType.EMPTY): LexerTransitionFunctionReturnType {
  if (!cursor.peekMatchAfterSpaces('(')) {
    return { state: LexerState.FLOW_CONTROL_BLOCK, tokens: [{ type }] };
  }

  cursor.skipSpaces();
  return { state: LexerState.FLOW_CONTROL_CONDITION, tokens: [{ type }], pushState: true };
}