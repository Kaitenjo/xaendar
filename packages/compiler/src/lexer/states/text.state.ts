import { AT_SIGN, CR, LEFT_BRACE, LESS_THAN, LF, RIGHT_BRACE, SLASH } from "../../costants/chars.constants";
import { isNotBlank } from "../../utils/chars.utils";
import { LexerCursor } from "../models/lexer-cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeText(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let text = '';
  let retVal!: LexerTransitionFunctionReturnType

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
          state: LexerState.FLOW_CONTROL,
        }
        read = false;
        break;

      case RIGHT_BRACE:
        if (context.history[context.history.length - 1] === LexerState.FLOW_CONTROL_BLOCK) {
          cursor.advance();
          retVal = { 
            state: LexerState.TEXT,
            tokens: [{ type: TokenType.BLOCK_CLOSE }],
            popState: true 
          };
          read = false;
        } else {
          cursor.advance();
          text = `${text}${cursor.currentChar.value}`;
        }
        break;

      case LF:
      case CR:
        cursor.advance();
        break;

      default:
        cursor.advance();
        text = `${text}${cursor.currentChar.value}`;
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
  retVal.tokens ??= (isNotBlank(text)
    ? [{ type: TokenType.TEXT, parts: [text] }]
    : undefined);

  return retVal
}