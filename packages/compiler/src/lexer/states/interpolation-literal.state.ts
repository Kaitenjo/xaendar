import { GRAVE_ACCENT, RIGHT_BRACE } from "../../costants/chars.constants";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

export function consumeInterpolationliteral(cursor: Cursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let interpolation = '';
  let retVal!: LexerTransitionFunctionReturnType;

  // Consume '`' character
  cursor.advance();

  while (read) {
    switch (cursor.peek()) {
      case GRAVE_ACCENT:
        cursor.advance();

        if (cursor.peek() === RIGHT_BRACE) {
          cursor.advance();
          /*
            After an interpolation we have to understanad where to transite
            The next state depends from the previous state
          */
          const previousState = context.history.pop();
          let state!: LexerState;

          switch (previousState) {
            case LexerState.ATTRIBUTE:
              state = LexerState.TAG_BODY
              break;

            case LexerState.TEXT:
              state = LexerState.TEXT
          };

          retVal = {
            state,
            tokens: [{
              type: TokenType.INTERPOLATION_LITERAL,
              parts: [interpolation]
            }],
            popState: true
          }
          read = false;
        } else {
          /*
            If ` is not followed by }, it means the interpolation is not closed
            and ` is part of the interpolated string
                                   |
                                   ˅
            Example: {`text ${var} ` text`}
          */
          interpolation = `${interpolation}${cursor.currentChar.value}`
        }
        break;

      default:
        interpolation = addCharacter(cursor, interpolation);
    }
  }

  return retVal;
}

function addCharacter(cursor: Cursor, interpolation: string): string {
  cursor.advance(1);
  return `${interpolation}${cursor.currentChar.value}`;
}