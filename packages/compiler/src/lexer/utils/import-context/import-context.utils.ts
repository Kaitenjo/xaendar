import type { ImportContext } from '../../types/import-context/import-context.type';
import { TokenType } from '../../types/token-type.enum';
import type { ImportToken } from '../../types/tokens/import-token.type';
import { lexImportHeader } from '../import-header/import-header.utils';

/**
 * What precedes the cursor in the specifier it is in: the name being written, with nothing else before it.
 */
const SYMBOL_BEFORE = /^\s*([\w$]*)$/;

/**
 * The end of the part of a symbol following the cursor: the first character that cannot be in a name, or the end of the text.
 */
const SYMBOL_END = /[^\w$]|$/;

/**
 * Tells whether a symbol is being written between the braces of an `@import` statement at an offset of a template.
 * Only the header of the template, the statements it starts with, is lexed: the template may not compile (e.g. while
 * the user is typing), as long as the statement can be lexed.
 *
 * The statement must be complete (it needs the path of the module), and the cursor must not be on the alias of a
 * specifier (`Name as |`).
 *
 * @example
 * getImportContext('@import { Ch } from \'./child\';', 12);  // { path: './child', span: { start: 10, end: 12 }, imported: [] }
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @returns The symbol being written, `undefined` if the offset is not on a symbol of an `@import` statement.
 */
export function getImportContext(source: string, offset: number): ImportContext | undefined {
  const { lexer } = lexImportHeader(source);

  // The tokens of the specifiers come right before the one of the path
  let specifiers = new Array<ImportToken>();
  for (let i = 0; i < lexer.tokens.length; i++) {
    const token = lexer.tokens[i];
    switch (token.type) {
      case TokenType.IMPORT:
        specifiers.push(token);
        break;

      case TokenType.IMPORT_PATH: {
        // Nothing but spaces separates the keyword from the opening brace, which the span of the first specifier starts before
        const braceStart = source.indexOf('{', specifiers[0].span.start);
        if (braceStart < offset && offset <= specifiers[specifiers.length - 1].span.end) {
          return toImportContext(source, offset, braceStart, specifiers, token.parts[0]);
        }

        specifiers = [];
        break;
      }

      default:
        specifiers = [];
    }
  }

  return undefined;
}

/**
 * Builds the context of a symbol being written in a statement.
 *
 * @param source - The source of the template.
 * @param offset - The offset in the template.
 * @param braceStart - The offset of the opening brace of the statement.
 * @param specifiers - The tokens of the specifiers of the statement.
 * @param path - The path of the module the statement imports from.
 * @returns The context, `undefined` if the cursor is not on the name of a specifier.
 */
function toImportContext(source: string, offset: number, braceStart: number, specifiers: readonly ImportToken[], path: string): ImportContext | undefined {
  // A specifier ends at the comma or the brace closing it, and the next one starts after it
  const current = specifiers.findIndex(({ span }) => offset <= span.end);
  const specifierStart = current === 0 ? braceStart + 1 : specifiers[current - 1].span.end + 1;
  const partial = SYMBOL_BEFORE.exec(source.slice(specifierStart, offset))?.[1];
  if (partial === undefined) {
    return undefined;
  }

  const imported = specifiers
    .filter((_specifier, index) => index !== current)
    .map(({ parts: [specifier] }) => specifier.split(/\s+as\s+/)[0].trim())
    .filter(name => name.length > 0);
  return { path, span: { start: offset - partial.length, end: offset + source.slice(offset).search(SYMBOL_END) }, imported };
}
