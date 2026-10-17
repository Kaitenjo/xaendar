import { AT_SIGN, CR, LEFT_BRACE, LESS_THAN, LF, RIGHT_BRACE, SLASH } from '../../../costants/chars.constant.js';
import { isNotBlank } from '../../utils/chars/chars.utils.js';
import { endOfFile, LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model.js';
import { LexerState } from '../../types/lexer-state.enum.js';
import { TokenType } from '../../types/token-type.enum.js';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type.js';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type.js';
import { Token, TokenWithOptionalSpan } from '../../types/token.type.js';

/**
 * Consumes plain text content, accumulating characters until a structural boundary
 * is reached: `<` (tag open/close), `{` (interpolation), `@` (flow-control),
 * or `}` (block close). Emits a TEXT token if non-blank text was accumulated, or whitespace separating
 * two inline nodes on the same line (see {@link separatesInlineNodes}).
 *
 * @param cursor - The lexer cursor positioned at the start of text content.
 * @param context - The lexer context used to detect flow-control block boundaries.
 * @returns Transition result with an optional TEXT token and the next state.
 */
export function lexText(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let text = '';
  let lineBreak = false;
  let retVal!: LexerTransitionFunctionReturnType

  try {
    while (read) {
      switch (cursor.peek()) {
        case LESS_THAN:
          // If after '<' we read a '/', we suppose we're approaching a ClosureTag, otherwise an OpenTag
          const nextState = cursor.peek(1, { offset: 1 }) === SLASH ? LexerState.TAG_CLOSE : LexerState.TAG_OPEN_NAME;
          retVal = { state: nextState }
          read = false;
          break;
  
        case LEFT_BRACE:
          retVal = { 
            state: LexerState.INTERPOLATION,
            pushState: true
          };
          read = false;
          break;
        
        case AT_SIGN:
          retVal = {
            state: LexerState.FLOW_CONTROL
          }
          read = false;
          break;
  
        case RIGHT_BRACE:
          if (context.history[context.history.length - 1] === LexerState.FLOW_CONTROL_BLOCK) {
            cursor.advance();
            const tokens = new Array<TokenWithOptionalSpan>;
            if (isNotBlank(text)) {
              tokens.push({ type: TokenType.TEXT, parts: [text] });
            }
            tokens.push({ type: TokenType.BLOCK_CLOSE });
            
            retVal = { 
              state: LexerState.TEXT,
              tokens,
              popState: true 
            };
            read = false;
          } else {
            cursor.advance();
            text = `${text}${cursor.currentChar.value}`;
          }
          break;
  
        /*
          Line breaks are kept, as in HTML, where CR LF and a lone CR are read as LF.
          The LF is appended before peeking at the character after a CR, which throws at the end of the file.
        */
        case LF:
          cursor.advance();
          text = `${text}\n`;
          lineBreak = true;
          break;

        case CR:
          cursor.advance();
          text = `${text}\n`;
          lineBreak = true;

          if (cursor.peek() === LF) {
            cursor.advance();
          }
          break;
  
        default:
          cursor.advance();
          text = `${text}${cursor.currentChar.value}`;
      }
    }
  } catch (err) {
    /* 
      If the template ends with a text, we cannot determine when the text actually ends, 
      so we catch the expection and, if text is not empty, we emit a TEXT token.

      The next state will be TEXT with the accumulated text equal to empty
      due to have reached end of file the previous state transition, so the
      condition will not be met and the expection will be thrown with the same error
      causing the correct exit from the lexer loop.
    */
    if (text && err instanceof Error && err.cause === endOfFile) {
      retVal = { 
        state: LexerState.TEXT,
      };
    } else {
      throw err;
    }
  }


  /*
    If the first read character trigger a StateChange
    The cumulative `text` variable will be empty

    In this case we must NOT add any token

    Ex:
    Template starts with a tag:
      `<div ...`
    Or an interpolation:
      `{ myVariable }`
  */
  retVal.tokens ??= (isNotBlank(text) || separatesInlineNodes(text, lineBreak, context.tokens.at(-1), retVal.state)
    ? [{ type: TokenType.TEXT, parts: [text] }]
    : undefined);

  return retVal
}

/**
 * Tells whether a whitespace-only text separates two inline nodes on the same line: an interpolation or an element
 * before it, and an interpolation or an element after it. That space is part of the content, as in `{ first } { second }`,
 * while the whitespace laying out the template, which holds a line break, is dropped.
 *
 * @param text - The whitespace-only text.
 * @param lineBreak - Whether the text holds a line break.
 * @param previousToken - The token emitted before the text, if any.
 * @param nextState - The state following the text.
 * @returns `true` if the text has to be kept, `false` otherwise.
 */
function separatesInlineNodes(text: string, lineBreak: boolean, previousToken: Token | undefined, nextState: LexerState): boolean {
  return !!text && !lineBreak && !!previousToken && isInlineNodeEnd(previousToken.type) && isInlineNodeStart(nextState);
}

/**
 * Tells whether a token ends an inline node: an interpolation, or an element closed by its closing tag or self-closed.
 *
 * @param type - The type of the token.
 * @returns `true` if the token ends an inline node, `false` otherwise.
 */
function isInlineNodeEnd(type: TokenType): boolean {
  switch (type) {
    case TokenType.INTERPOLATION_EXPRESSION:
    case TokenType.TAG_CLOSE_NAME:
    case TokenType.TAG_SELF_CLOSE:
      return true;

    default:
      return false;
  }
}

/**
 * Tells whether a state starts an inline node: an interpolation or an opening tag.
 *
 * @param state - The state following a text.
 * @returns `true` if the state starts an inline node, `false` otherwise.
 */
function isInlineNodeStart(state: LexerState): boolean {
  switch (state) {
    case LexerState.INTERPOLATION:
    case LexerState.TAG_OPEN_NAME:
      return true;

    default:
      return false;
  }
}