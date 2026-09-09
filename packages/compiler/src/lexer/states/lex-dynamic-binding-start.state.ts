import { COMMA } from '../../costants/chars.constants';
import { LexerCursor } from '../types/lexer-cursor.model';
import { LexerState } from '../types/lexer-state.enum';
import { TokenType } from '../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../types/transition-function/transition-function-return-type.type';

/**
 * Lexes the start of a dynamic binding, consuming any leading commas and capturing the initial condition.
 * @param cursor - The lexer cursor pointing to the current position in the input.
 * @param _context - The context object providing additional information for the transition function.
 * @returns An object containing the next lexer state and the tokens produced.
 */
export function lexDynamicBindingStart(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let condition = '';

  while (read) {
    switch (cursor.peek()) {
      case COMMA:
        // Consume ','
        cursor.advance();
        break;

      default:
        cursor.advance();
        condition = `${condition}${cursor.currentChar.value}`;
        read = false;
    }
  }

  return {
    state: LexerState.DYNAMIC_BINDING_BODY,
    tokens: [{
      type: TokenType.DYNAMIC_BINDING,
      parts: [condition]
    }]
  };

} 