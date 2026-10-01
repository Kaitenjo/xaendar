import { CR, DOUBLE_QUOTE, EQUAL_THEN, GREATER_THEN, LEFT_BRACE, LF, LPAREN, RIGHT_BRACE, RPAREN, SINGLE_QUOTE, SLASH, SPACE, TAB } from '../../../costants/chars.constants';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { resolveTagBodyState } from '../../utils/tag-body-state/tag-body-state.utils';

/**
 * Consumes an attribute name and optional value from the current position,
 * transitioning back to TAG_BODY when a whitespace, `/`, or `>` is encountered.
 * If the attribute value is an interpolation, pushes the INTERPOLATION state.
 *
 * @param cursor - The lexer cursor positioned at the start of the attribute.
 * @param context - Unused lexer context.
 * @returns Transition result with the ATTRIBUTE token and next state.
 * @throws If the attribute name is malformed or contains `(`, a `)` is found outside of a directive, or a `}` is found outside of a conditional binding.
 */
export function lexAttribute(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let attribute = '';
  let retVal!: LexerTransitionFunctionReturnType;
  
  while (read) {
    switch (cursor.peek()) {
      /*
        Cover the cases where the attribute is applied without any value
        Ex:
        <input disabled />

        A tag can span multiple lines, so the attribute name can also be followed
        by a tab or a line break instead of a space.
      */
      case SPACE:
      case TAB:
      case LF:
      case CR:
        cursor.advance();
        read = false;
        retVal = {
          state: resolveTagBodyState(context.history.at(-1)),
          tokens: [{
            type: TokenType.ATTRIBUTE,
            parts: [attribute]
          }]
        }
        break;

      /*
        Cover cases where the attribute name is immediately followed by '>' or '/'
        without a separating space.
        Ex:
        <input disabled>
        <input disabled/>
      */
      case GREATER_THEN:
      case SLASH:
        read = false;
        retVal = {
          state: resolveTagBodyState(context.history.at(-1)),
          tokens: [{
            type: TokenType.ATTRIBUTE,
            parts: [attribute]
          }]
        }
        break;

      /*
        Cover cases where the attribute name is immediately followed by the ')'
        closing a directive, without a separating space.
        The ')' is left to the directive body, which closes the directive.
        Ex:
        <input @@myDirective(disabled) />

        Outside of a directive there is nothing for ')' to close.
      */
      case RPAREN:
        if (resolveTagBodyState(context.history.at(-1)) !== LexerState.DIRECTIVE_BODY) {
          throw new Error('Unexpected \')\': there is no directive to close');
        }

        read = false;
        retVal = {
          state: LexerState.DIRECTIVE_BODY,
          tokens: [{
            type: TokenType.ATTRIBUTE,
            parts: [attribute]
          }]
        }
        break;

      /*
        Cover cases where the attribute name is immediately followed by the '}'
        closing a block of a conditional binding, without a separating space.
        The '}' is left to the conditional binding body, which closes the block.
        Ex:
        <input @if (isDisabled()) { disabled} />

        Outside of a conditional binding there is nothing for '}' to close.
      */
      case RIGHT_BRACE:
        if (resolveTagBodyState(context.history.at(-1)) !== LexerState.CONDITIONAL_BINDING_BODY) {
          throw new Error('Unexpected \'}\': there is no conditional binding to close');
        }

        read = false;
        retVal = {
          state: LexerState.CONDITIONAL_BINDING_BODY,
          tokens: [{
            type: TokenType.ATTRIBUTE,
            parts: [attribute]
          }]
        }
        break;

      /*
        '(' opens an event binding, so it cannot be part of an attribute name:
        it means the separating space before the event binding is missing.
        Ex:
        <input disabled(input)="onInput()" />
      */
      case LPAREN:
        throw new Error('Unexpected \'(\' in attribute name: event bindings must be separated from the previous binding by a space');

      case EQUAL_THEN:
        /*
          Unlike event handler where we can simply throw error if eventName is
          followed by a space instead of "=", in the attributes the situation is 
          different.

          Attributes can have a name without any value
          e.g. <input disabled />
          
          So we cannot throw if an attribute is followed by a space instead of "="
          But we have to check if we find a "=" without a previous valid attribute name
          e.g. <input disabled ="false" />
        */
        if (!attribute) {
          throw new Error('Attribute cannot start with \'=\'');
        }

        cursor.advance();
        
        // If attribute has a value, it must start with double quotes
        if (cursor.peek() !== DOUBLE_QUOTE) {
          throw 'Attribute value must start with double quotes \'"\'';
        }

        // Consume '"'
        cursor.advance();
        read = false;
        const isInterpolatedValue = cursor.peek() === LEFT_BRACE;

        retVal = {
          state: isInterpolatedValue ? LexerState.INTERPOLATION : LexerState.ATTRIBUTE_VALUE,
          /*
            This push is needed by
            - Interpolation Expression
            - Interpolation Literal

            When we go back to their calling state, we need to consume Double Quotes '"'
            if we arrived there from an Attribute Value state, otherwise we are arrived from 'tag body' (or others in the future) state.
            In the case of 'tag body', we do not need to consume the double quotes beacuse there are no surrounding quotes to handle.

            Example:
              <input class="{expression}" /> <-- We must consume Double Quotes

              <div>
                {expression}                 <-- We do not need to consume Double Quotes
              </div>

           */
          pushState: true,
          tokens: [{
            type: TokenType.ATTRIBUTE,
            parts: [attribute]
          }]
        }
        break;

      case DOUBLE_QUOTE:
      case SINGLE_QUOTE:
        /*
          Break is missing or purpose cause the code after the if 
          would be the same as default case
        */
        if (!attribute) {
          throw new Error('Attribute cannot start with \' or \"');
        }

      default:
        cursor.advance();
        attribute = `${attribute}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}