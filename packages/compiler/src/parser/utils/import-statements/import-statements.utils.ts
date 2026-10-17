import { TokenType } from '../../../lexer/types/token-type.enum';
import type { ImportToken } from '../../../lexer/types/tokens/import-token.type';
import { lexImportHeader } from '../../../lexer/utils/import-header/import-header.utils';
import { parseSpecifier } from '../../states/parse-import/parse-import.state';
import type { ImportNode } from '../../types/nodes/import-node.type';
import type { ImportSpecifier } from '../../types/nodes/import-specifier.type';

/**
 * Reads the `@import` statements of a template as far as it can be lexed, so that the imports of a template are known
 * while the rest of it cannot be compiled (e.g. while the user is typing). Unlike `parseTemplate`, it doesn't fail on
 * an error: the statements that are not complete, and the specifiers that are not valid (e.g. the empty one left by
 * a trailing comma), are left out.
 *
 * @example
 * parseImportStatements('@import { A, B as C, } from \'./a\';\n<b');  // [{ path: './a', specifiers: [A, B as C] }]
 *
 * @param source - The source of the template.
 * @returns The path and the specifiers of each statement, in the order they are written in.
 */
export function parseImportStatements(source: string): Array<Pick<ImportNode, 'path' | 'specifiers'>> {
  const { tokens } = lexImportHeader(source);
  const statements = new Array<Pick<ImportNode, 'path' | 'specifiers'>>();
  // The tokens of the specifiers of a statement come right before the one of its path
  let specifiers = new Array<ImportSpecifier>();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    switch (token.type) {
      case TokenType.IMPORT:
        specifiers.push(...toSpecifiers(source, token));
        break;

      case TokenType.IMPORT_PATH:
        statements.push({ path: token.parts[0], specifiers });
        specifiers = [];
        break;

      default:
        specifiers = [];
    }
  }

  return statements;
}

/**
 * Parses the specifier of an `@import` token.
 *
 * @param source - The source of the template.
 * @param token - The token of the specifier.
 * @returns The specifier, none if it is empty or not valid.
 */
function toSpecifiers(source: string, { parts: [raw], span }: ImportToken): ImportSpecifier[] {
  const trimmed = raw.trim();
  try {
    return trimmed ? [parseSpecifier(trimmed, source.indexOf(trimmed, span.start))] : [];
  } catch {
    return [];
  }
}
