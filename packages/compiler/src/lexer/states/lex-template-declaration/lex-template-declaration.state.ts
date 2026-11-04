import { CR, EQUAL_THEN, GREATER_THEN, LF, LPAREN, SLASH, SPACE, TAB } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { MaybeTokenWithSpan } from '../../types/maybe-token-with-span.type';
import type { TemplateDeclarationToken } from '../../types/tokens/template-declaration-token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { lexGroup } from '../../utils/group/group.utils';

/**
 * Consumes the declaration of a template on a `<template>`, its name and its parameters, e.g. `row(item: Item)` in
 * `<template row(item: Item)>`, and transitions back to TAG_BODY. The parameters are read up to the parenthesis closing
 * them, and are the second part of the token (empty for `name()`). A name without parameters is left to the parser,
 * which reports it.
 *
 * @param cursor - The lexer cursor positioned at the start of the name.
 * @param _context - Unused lexer context.
 * @returns Transition result with the TEMPLATE_DECLARATION token and the TAG_BODY state.
 * @throws If the name is given a value, or the parameters are declared twice or not followed by a whitespace, `/` or `>`.
 */
export function lexTemplateDeclaration(cursor: LexerCursor, _context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let name = '';
  let parameters: string | undefined;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      // A tag can span multiple lines: the declaration can also be followed by a tab or a line break
      case SPACE:
      case TAB:
      case LF:
      case CR:
      case GREATER_THEN:
      case SLASH:
        retVal = {
          state: LexerState.TAG_BODY,
          tokens: [toTemplateDeclarationToken(name, parameters)]
        };
        read = false;
        break;

      case LPAREN:
        if (parameters !== undefined) {
          throw 'A template declares its parameters only once, right after its name';
        }

        // Consume '('
        cursor.advance();
        parameters = lexGroup(cursor, LPAREN);
        break;

      case EQUAL_THEN:
        throw 'A <template> declares only its name and its parameters, e.g. <template row(item: Item)>: it takes no attributes';

      default:
        if (parameters !== undefined) {
          throw 'The parameters of a template must be followed by a whitespace, / or >, e.g. <template row(item: Item)>';
        }

        cursor.advance();
        name = `${name}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}

/**
 * Builds the token of the declaration of a template.
 *
 * @param name - The name of the template.
 * @param parameters - The text of the parameters, if the template declares them.
 * @returns The token, whose second part is the text of the parameters only when the template declares them.
 */
function toTemplateDeclarationToken(name: string, parameters: string | undefined): MaybeTokenWithSpan<TemplateDeclarationToken> {
  return parameters === undefined ? { type: TokenType.TEMPLATE_DECLARATION, parts: [name] } : { type: TokenType.TEMPLATE_DECLARATION, parts: [name, parameters] };
}
