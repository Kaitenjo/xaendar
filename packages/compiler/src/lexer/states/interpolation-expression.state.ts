import { LEFT_BRACE, RIGHT_BRACE, SPACE } from '../../costants/chars.constants';
import { LexerCursor } from '../models/lexer-cursor.model';
import { LexerState } from '../models/lexer-state.enum';
import { TokenType } from '../models/token-type.enum';
import { LexerTransitionFunctionContext } from '../models/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../models/transition-function/transition-function-return-type.type';

export function consumeInterpolationExpression(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let interpolation = '';
  let deep = 1
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      case LEFT_BRACE:
        deep++;
        interpolation = addCharacter(cursor, interpolation);
        break;

      case RIGHT_BRACE:
        deep--;
        
        if (deep === 0) {
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
              type: TokenType.INTERPOLATION_EXPRESSION, 
              parts: [interpolation] 
            }],
            popState: true
          }
          read = false;
        } else {
          interpolation = addCharacter(cursor, interpolation);
        }

        break;

      default:
        interpolation = addCharacter(cursor, interpolation);
    }
  }

  return retVal;
}

function addCharacter(cursor: LexerCursor, interpolation: string): string {
  cursor.advance(1);
  return `${interpolation}${cursor.currentChar.value}`;
}