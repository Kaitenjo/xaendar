import { CR, DOUBLE_QUOTE, EQUAL_THEN, GREATER_THEN, LF, LPAREN, RPAREN, SINGLE_QUOTE, SLASH, SPACE, TAB } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { Token } from '../../types/token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';

/**
 * Tells whether the last emitted tokens are those of a directive declared without bindings, e.g. `@@selector`.
 * An unclosed event binding right after it most likely holds the bindings of that directive,
 * separated from the selector by a space, e.g. `@@selector (name="value")`.
 *
 * @param tokens - The tokens emitted so far.
 * @returns `true` if the last tokens are a DIRECTIVE immediately followed by its DIRECTIVE_CLOSE.
 */
function isBindinglessDirective(tokens: Token[]): boolean {
  return tokens.at(-1)?.type === TokenType.DIRECTIVE_CLOSE && tokens.at(-2)?.type === TokenType.DIRECTIVE;
}

/**
 * Consumes a DOM event binding `(eventName)="handler()"` starting with `(` and reads the
 * event name until the closing `)`, which must be immediately followed by `="`.
 * Emits an EVENT token containing only the event name,
 * then transitions to EVENT_HANDLER to parse the handler token.
 *
 * @param cursor - The lexer cursor positioned on the `(` character.
 * @param context - The lexer context, whose tokens tell whether the binding follows a directive without bindings.
 * @returns Transition result with the EVENT token and EVENT_HANDLER state.
 * @throws If the event name is empty, contains whitespace, is not closed by `)`, or is not followed by `="`.
 */
export function lexEvent(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let eventName = '';
  let retVal!: LexerTransitionFunctionReturnType;

  // Consume '(' character
  cursor.advance();

  while (read) {
    switch (cursor.peek()) {
      // Tabs and line breaks are no more part of the name than spaces are
      case SPACE:
      case TAB:
      case LF:
      case CR:
        throw 'No spaces are allowed in event name';

      /*
        Characters that cannot be part of an event name: finding one means the ')'
        closing the name is missing.
        Ex:
        <button (click="onClick()">
        <button (click>
      */
      case LPAREN:
      case EQUAL_THEN:
      case DOUBLE_QUOTE:
      case SINGLE_QUOTE:
      case GREATER_THEN:
      case SLASH:
        throw isBindinglessDirective(context.tokens)
          ? 'Event name must be closed by \')\': directive bindings must immediately follow the selector, without spaces, e.g. @@selector(name="value")'
          : 'Event name must be closed by \')\'';

      case RPAREN:
        if (!eventName) {
          throw 'Event name cannot be empty';
        }

        // Consume ')'
        cursor.advance();

        if (cursor.peek() !== EQUAL_THEN) {
          throw 'Event name must be followed by \'=\'';
        }

        // Consume '='
        cursor.advance();

        if (cursor.peek() !== DOUBLE_QUOTE) {
          throw 'Event handler must be included in Double Quotes';
        }

        // Consume '"'
        cursor.advance();
        retVal = {
          state: LexerState.EVENT_HANDLER,
          tokens: [{
            type: TokenType.EVENT,
            parts: [eventName]
          }]
        };
        read = false;
        break;

      default:
        cursor.advance();
        eventName = `${eventName}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}
