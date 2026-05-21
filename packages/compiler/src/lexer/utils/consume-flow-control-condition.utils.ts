import { LPAREN, RPAREN } from "../../costants/chars.constants";
import { LexerCursor } from "../types/lexer-cursor.model";
import { LexerTransitionFunctionContext } from "../types/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../types/transition-function/transition-function-return-type.type";

export function consumeFlowControlCondition(cursor: LexerCursor, _context: LexerTransitionFunctionContext): string {
  cursor.skipSpaces();

  if (cursor.peek() !== LPAREN) {
    throw new Error(`Expected '(' but got '${String.fromCharCode(cursor.peek())}' at row ${cursor.position.row}, col ${cursor.position.column}`)
  }

  // consume '('
  cursor.advance();

  let expression = '';
  let depth = 1;

  while (depth > 0) {
    const code = cursor.peek();

    switch (code) {
      case LPAREN:
        depth++;
        expression = addCharacter(cursor, expression);
        break;

      case RPAREN:
        depth--;
        if (!depth) {
          cursor.advance();
          break;
        }

        expression = addCharacter(cursor, expression);
        break;

      default:
        expression = addCharacter(cursor, expression);
    }
  }

  return expression;
}

/**
 * Advances the cursor by one character and appends it to the accumulator string.
 *
 * @param cursor The lexer cursor to advance.
 * @param expression The current accumulated string.
 * @returns The updated string with the new character appended.
 */
export function addCharacter(cursor: LexerCursor, expression: string): string {
  cursor.advance();
  return `${expression}${cursor.currentChar.value}`;
}