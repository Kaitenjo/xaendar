import { NoArgsFunction } from '@xaendar/types';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { ImportPathToken } from '../../../lexer/types/tokens/import-path-token.type';
import { ImportToken } from '../../../lexer/types/tokens/import-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode, MaybeASTNodeWithSpan } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import { ImportNode } from '../../types/nodes/import-node.type';
import { ImportSpecifier } from '../../types/nodes/import-specifier.type';

/**
 * Parses an `@import` statement.
 *
 * Extracts specifiers with optional aliases and maps them to structured
 * `ImportSpecifier` objects. Supports:
 * - `foo` → imported: 'foo', local: 'foo'
 * - `foo as bar` → imported: 'foo', local: 'bar'
 * - `default as D` → imported: 'default', local: 'D'
 * - `* as ns` → imported: '*', local: 'ns'
 */
export function parseImport(cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, _token: ImportPathToken): MaybeASTNodeWithSpan<ImportNode> {
  const specifiers = new Array<ImportSpecifier>();

  while (cursor.peek().type === TokenType.IMPORT) {
    cursor.advance();
    const { parts: [rawSpecifier], span } = cursor.getCurrentToken<ImportToken>().value;
    const specifier = parseSpecifier(rawSpecifier, cursor.findSpan(rawSpecifier.trim(), span.start).start);
    specifiers.push(specifier);
  }

  // Consume TokenType.IMPORT_PATH
  cursor.advance();
  const { parts: [path], span } = cursor.getCurrentToken<ImportPathToken>().value;

  return {
    type: ASTNodeType.Import,
    specifiers,
    path,
    // The token starts with the `from` keyword, which the path may contain too
    pathSpan: cursor.findSpan(path, cursor.findSpan('from', span.start).end)
  }
}

/**
 * Parses a single import specifier string.
 *
 * @param raw - The raw specifier string (may include 'as' alias).
 * @param offset - The offset of the trimmed specifier in the template.
 * @returns An `ImportSpecifier` with `imported` and `local` fields and their spans.
 * @throws If the specifier format is invalid.
 */
export function parseSpecifier(raw: string, offset: number): ImportSpecifier {
  const trimmed = raw.trim();
  // The exported name always starts the specifier, the local alias always ends it
  const withSpans = (imported: string, local: string): ImportSpecifier => ({
    imported,
    local,
    importedSpan: { start: offset, end: offset + imported.length },
    localSpan: { start: offset + trimmed.length - local.length, end: offset + trimmed.length }
  });

  // Namespace import: `* as ns`
  const namespaceMatch = trimmed.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (namespaceMatch) {
    return withSpans('*', namespaceMatch[1]);
  }

  // Default import with alias: `default as D`
  const defaultMatch = trimmed.match(/^default\s+as\s+([A-Za-z_$][\w$]*)$/);
  if (defaultMatch) {
    return withSpans('default', defaultMatch[1]);
  }

  // Named import with optional alias: `foo` or `foo as bar`
  const namedMatch = trimmed.match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
  if (namedMatch) {
    return withSpans(namedMatch[1], namedMatch[2] ?? namedMatch[1]);
  }

  throw `Invalid import specifier "${raw}".`;
}
