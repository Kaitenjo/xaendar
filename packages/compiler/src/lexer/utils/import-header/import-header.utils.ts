import { Lexer } from '../../lexer/lexer';
import { TokenType } from '../../types/token-type.enum';
import type { Token } from '../../types/token.type';

/**
 * What follows the braces of an `@import` statement: the `from` keyword, the quoted path of the module and the optional `;`.
 */
export const IMPORT_STATEMENT_END = /^\}\s*from\s*(['"])[^'"]*\1(;?)/;

/**
 * The text that may separate the `@import` statements: spaces, line breaks and the `;` closing a statement.
 */
const STATEMENT_SEPARATOR = /^[;\s]*$/;

/**
 * Tells whether a text is only what separates the `@import` statements of a template: spaces, line breaks and `;`.
 *
 * @param text - The text.
 * @returns Whether the text can be in the header of a template.
 */
export function isImportSeparator(text: string): boolean {
  return STATEMENT_SEPARATOR.test(text);
}

/**
 * Tells whether a token ends the header of a template, the `@import` statements it starts with: the first one that
 * is neither part of a statement nor the text between two statements.
 *
 * @param token - The token.
 * @returns Whether the token follows the header.
 */
function isAfterImportHeader(token: Token): boolean {
  switch (token.type) {
    case TokenType.IMPORT:
    case TokenType.IMPORT_PATH:
      return false;

    case TokenType.TEXT:
      return !isImportSeparator(token.parts[0]);

    default:
      return true;
  }
}

/**
 * Lexes the header of a template, the `@import` statements it starts with, and nothing else: the statements are only
 * valid before the rest of the template, so the editor tooling, which asks for them at every keystroke, doesn't need
 * to lex the whole of it. The last token is the first one following the header, if the template has more than it.
 *
 * @example
 * lexImportHeader('@import { A } from \'./a\';\n<p>text</p>').lexer.tokens;  // the tokens of the statement, then the one of the tag
 *
 * @param source - The source of the template.
 * @returns The lexer, to read the tokens of the header and the state it stopped in, and whether a statement of the header
 *   could not be lexed: the tokens before it are still in the lexer.
 */
export function lexImportHeader(source: string): { lexer: Lexer, failed: boolean } {
  const lexer = new Lexer(source);
  try {
    lexer.tokenize(isAfterImportHeader);
    return { lexer, failed: false };
  } catch {
    return { lexer, failed: true };
  }
}
