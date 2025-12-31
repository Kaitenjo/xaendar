import { LEFT_BRACE, LESS_THAN, LF, SLASH, SPACE } from "../../costants/chars.constants";
import { isNotBlank } from "../../utils/chars.utils";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { Token } from "../models/token.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function-return-type.type";

export function consumeText(cursor: Cursor): LexerTransitionFunctionReturnType {
  let read = true;
  let nextState!: LexerState;
  let text = '';

  while (read) {
    switch (cursor.peek()) {
      case LESS_THAN:
        // If after '<' we read a '/', we suppose we're approaching a ClosureTag, otherwise an OpenTag
        nextState = cursor.peek(1, { offset: 1 }) === SLASH ? LexerState.TAG_CLOSE_NAME : LexerState.TAG_OPEN_NAME;
        read = false;
        break;

      case LEFT_BRACE:
        nextState = LexerState.INTERPOLATION_START;
        read = false;
        break;

      case SPACE:
      case LF:
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
  const tokens: Token[] | undefined = isNotBlank(text)
    ? [{ type: TokenType.TEXT, parts: [text] }]
    : undefined;

  return {
    state: nextState,
    tokens
  }
}