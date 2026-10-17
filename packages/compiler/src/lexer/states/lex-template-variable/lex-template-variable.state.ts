import { CR, EQUAL_THEN, GREATER_THEN, LF, LPAREN, SLASH, SPACE, TAB } from '../../../costants/chars.constant';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import type { MaybeTokenWithSpan, Token } from '../../types/token.type';
import type { TagOpenNameToken } from '../../types/tokens/tag-open-name-token.type';
import type { TemplateVariableToken } from '../../types/tokens/template-variable-token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { LexerTransitionFunctionReturnType } from '../../types/transition-function/transition-function-return-type.type';
import { lexGroup } from '../../utils/group/group.utils';

/**
 * Consumes a template variable, after the `#` already consumed by the tag body, and transitions back to TAG_BODY:
 * - `#name` names the element it is declared on, e.g. `<input #name />`;
 * - `#name(…)` declares a template, and is only valid on a `<template>`, e.g. `<template #row(item: Item)>`: the
 *   parameters are read up to the parenthesis closing them, and are the second part of the token (empty for `#name()`).
 *
 * @param cursor - The lexer cursor positioned right after `#`.
 * @param context - The lexer context, whose tokens tell the element the variable is declared on.
 * @returns Transition result with the TEMPLATE_VARIABLE token and the TAG_BODY state.
 * @throws If the name is empty or given a value, the parameters are declared on an element other than a `<template>`
 *   or twice, or they are not followed by a whitespace, `/` or `>`.
 */
export function lexTemplateVariable(cursor: LexerCursor, context: LexerTransitionFunctionContext): LexerTransitionFunctionReturnType {
  let read = true;
  let name = '';
  let parameters: string | undefined;
  let retVal!: LexerTransitionFunctionReturnType;

  while (read) {
    switch (cursor.peek()) {
      // A tag can span multiple lines: the name can also be followed by a tab or a line break
      case SPACE:
      case TAB:
      case LF:
      case CR:
      case GREATER_THEN:
      case SLASH:
        assertName(name);
        retVal = {
          state: LexerState.TAG_BODY,
          tokens: [toTemplateVariableToken(name, parameters)]
        };
        read = false;
        break;

      case LPAREN:
        assertName(name);
        if (parameters !== undefined) {
          throw 'A template declares its parameters only once, right after its name';
        }

        if (getTagName(context.tokens) !== 'template') {
          throw 'Only a <template> declares parameters, e.g. <template #row(item: Item)>: on any other element a template variable is just #name';
        }

        // Consume '('
        cursor.advance();
        parameters = lexGroup(cursor, LPAREN);
        break;

      case EQUAL_THEN:
        throw 'A template variable takes no value: write #name, which names the element it is declared on';

      default:
        if (parameters !== undefined) {
          throw 'The parameters of a template must be followed by a whitespace, / or >, e.g. <template #row(item: Item)>';
        }

        cursor.advance();
        name = `${name}${cursor.currentChar.value}`;
    }
  }

  return retVal;
}

/**
 * Builds the token of a template variable.
 *
 * @param name - The name of the variable.
 * @param parameters - The text of the parameters, if the variable declares a template.
 * @returns The token, whose second part is the text of the parameters only when the variable declares them.
 */
function toTemplateVariableToken(name: string, parameters: string | undefined): MaybeTokenWithSpan<TemplateVariableToken> {
  return parameters === undefined ? { type: TokenType.TEMPLATE_VARIABLE, parts: [name] } : { type: TokenType.TEMPLATE_VARIABLE, parts: [name, parameters] };
}

/**
 * Returns the tag name of the element whose opening tag is being lexed: the one of the last opening tag emitted.
 *
 * @param tokens - The tokens emitted so far.
 * @returns The tag name, `undefined` if no opening tag was emitted.
 */
function getTagName(tokens: readonly Token[]): string | undefined {
  return tokens.findLast((token): token is TagOpenNameToken => token.type === TokenType.TAG_OPEN_NAME)?.parts[0];
}

/**
 * Ensures the name of a template variable is not empty.
 *
 * @param name - The name read so far.
 * @throws If the name is empty.
 */
function assertName(name: string): void {
  if (!name) {
    throw 'A template variable needs a name, e.g. #name';
  }
}
