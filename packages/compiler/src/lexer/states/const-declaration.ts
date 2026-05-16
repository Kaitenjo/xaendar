import { TokenType } from "@xaendar/compiler";
import { EQUAL_THEN, SEMICOLON, SPACE } from "../../costants/chars.constants";
import { LexerCursor } from "../models/lexer-cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { LexerTransitionFunctionContext } from "../models/transition-function/transition-function-context.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function/transition-function-return-type.type";

/**
 * Consumes a `@const name = expression;` declaration from the current position.
 * Expects the cursor to be positioned after the `@const ` keyword.
 * Emits a CONST_DECLARATION token containing the variable name and initializer expression.
 *
 * @param cursor The lexer cursor positioned at the start of the variable name.
 * @param _context Unused lexer context.
 * @returns Transition result with the CONST_DECLARATION token and the TEXT state.
 */
export function consumeConstDeclaration(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let varName = '';
  let expression = '';
  let retVal!: LexerTransitionFunctionReturnType;

  /*
    Skip all possible spaces between the 'const' identifier and the '='
    @const varName
    or
    @const          varName
  */
  cursor.skipSpaces();

  while(read) {
    switch (cursor.peek()) {
      case SPACE:
        read = false;
        break;

      default: 
        cursor.advance();
        varName = `${varName}${cursor.currentChar.value}`
    }
  }

  /*
    Skip all possible spaces between the varName and the '='
    varName =
    or
    varName          =
  */
  cursor.skipSpaces();

  const nextChar = cursor.peek();
  if (nextChar !== EQUAL_THEN) {
    throw new Error(`Unexpected character ${String.fromCharCode(nextChar)}.\nExpected '=' `);
  }
  
  cursor.advance();
  /*
    Skip all possible spaces between the '=' and the expression
    = user.name
    or
    =          user.name
  */
  cursor.skipSpaces();
  read = true

  while(read) {
    switch (cursor.peek()) {
      case SEMICOLON:
        retVal = {
          state: LexerState.TEXT,
          tokens: [{
            type: TokenType.CONST_DECLARATION,
            parts: [varName, expression]
          }]
        }
        read = false;
        break;

      default: 
        cursor.advance();
        expression = `${expression}${cursor.currentChar.value}`
    }
  }

  // Consume ';'
  cursor.advance();
  expression = `${expression};`

  return retVal;
}