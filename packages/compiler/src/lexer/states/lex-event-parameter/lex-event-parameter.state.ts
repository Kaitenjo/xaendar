import { COMMA, DOUBLE_QUOTE, LEFT_BRACE, LEFT_BRACKET, LPAREN, RIGHT_BRACE, RIGHT_BRACKET, RPAREN, SINGLE_QUOTE } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { resolveTagBodyState } from '../../utils/tag-body-state/tag-body-state.utils';

/**
 * Consumes an event parameter and reads until a ',' or ')'.
 * Emits an EVENT_ATTRIBUTE token containing the raw parameter string.
 *
 * @param cursor - The lexer cursor positioned on the `@` character.
 * @param _context - Unused lexer context.
 * @returns Transition result with the EVENT_PARAMETER token and the EVENT state.
 */
export function lexEventParameter(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let eventParameter = '';
  let charDelimiter: '"' | "'" | '[' | '{' |'' = '';
  // The parentheses opened by the calls inside the parameter, such as the read of a signal
  let parenDepth = 0;
  let parameterStart = cursor.currentChar.index + 1;

  const retVal: LexerTransitionFunctionReturnType = {
    state: resolveTagBodyState(context.history.at(-1)),
    tokens: []
  }

  while (read) {
    switch (cursor.peek()) {
      case LEFT_BRACKET:
      case RIGHT_BRACKET:
      case LEFT_BRACE:
      case RIGHT_BRACE:
      case DOUBLE_QUOTE:
      case SINGLE_QUOTE:
        eventParameter = addCharacter(cursor, eventParameter);
        if (!charDelimiter) {
          // Safe assumption
          charDelimiter = cursor.currentChar.value as typeof charDelimiter;
        } else if (charDelimiter === cursor.currentChar.value || (charDelimiter === '[' && cursor.currentChar.value === ']') || charDelimiter === '{' && cursor.currentChar.value === '}') {
          charDelimiter = '';
        }
        break;

      case LPAREN:
        eventParameter = addCharacter(cursor, eventParameter);
        if (!isInString(charDelimiter)) {
          parenDepth++;
        }
        break;

      case COMMA:
        if (!charDelimiter && !parenDepth) {
          const parameterEnd = cursor.currentChar.index + 1;
          retVal.tokens!.push({
            type: TokenType.EVENT_PARAMETER,
            parts: [eventParameter],
            span: {
              start: parameterStart,
              end: parameterEnd
            }
          });
          cursor.advance();
          cursor.skipSpaces();
          eventParameter = '';
          parameterStart = cursor.currentChar.index + 1;
        } else {
          eventParameter = addCharacter(cursor, eventParameter);
        }
        break;

      case RPAREN:
        // A parenthesis written in a string
        if (isInString(charDelimiter)) {
          eventParameter = addCharacter(cursor, eventParameter);
          break;
        }

        // A parenthesis closing a call inside the parameter
        if (parenDepth) {
          eventParameter = addCharacter(cursor, eventParameter);
          parenDepth--;
          break;
        }

        // Consume ')'
        cursor.advance();
        
        if (cursor.peek() !== DOUBLE_QUOTE) {
          throw 'Event must be included in Double Quotes';
        }

        // Consume '"'
        cursor.advance();

        if (!charDelimiter) {
          const parameterEnd = cursor.currentChar.index + 1;
          retVal.tokens!.push({
            type: TokenType.EVENT_PARAMETER,
            parts: [eventParameter],
            span: {
              start: parameterStart,
              end: parameterEnd
            }
          });
          read = false;
          break;
        }

        eventParameter = `${eventParameter}${cursor.currentChar.value}`;
        break;

      default:
        eventParameter = addCharacter(cursor, eventParameter);
    }
  }

  return retVal;
}

/**
 * Tells whether the parameter is being read inside a string literal.
 *
 * @param charDelimiter - The delimiter of the literal being read, if any.
 * @returns `true` if the delimiter is a quote.
 */
function isInString(charDelimiter: string): boolean {
  return charDelimiter === '"' || charDelimiter === '\'';
}

function addCharacter(cursor: LexerCursor, eventParameter: string): string {
  cursor.advance();
  return `${eventParameter}${cursor.currentChar.value}`;
}