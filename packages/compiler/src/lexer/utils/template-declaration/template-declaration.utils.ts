import type { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { TokenType } from '../../types/token-type.enum';
import type { Token } from '../../types/token.type';

/**
 * The start of the declaration of a template: a name directly followed by the parenthesis opening its parameters.
 */
const DECLARATION_START = /^[A-Za-z_$][\w$]*\(/;

/**
 * How many characters {@link expectsTemplateDeclaration} reads to find the start of a declaration: longer than any name.
 */
const DECLARATION_LOOKAHEAD = 256;

/**
 * Tells whether the next item of the opening tag being lexed is the declaration of a template: the tag is a
 * `<template>` that declares none yet, e.g. after `<template ` but not after `<template row() `, and the item is a name
 * followed by its parameters, `row(item: Item)`. Any other item of a `<template>` is an attribute of a standard
 * `<template>` element, e.g. `id="row"`.
 *
 * @param tokens - The tokens emitted so far.
 * @param cursor - The lexer cursor, positioned before the item.
 * @returns `true` if the opening tag is a `<template>` without a declaration, and the item declares one.
 */
export function expectsTemplateDeclaration(tokens: readonly Token[], cursor: LexerCursor): boolean {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    switch (token.type) {
      case TokenType.TEMPLATE_DECLARATION:
        return false;

      case TokenType.TAG_OPEN_NAME:
        return token.parts[0] === 'template' && cursor.peekMatch(DECLARATION_START, DECLARATION_LOOKAHEAD);
    }
  }

  return false;
}
