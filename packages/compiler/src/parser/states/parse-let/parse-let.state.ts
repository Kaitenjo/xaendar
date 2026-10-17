import type { NoArgsFunction } from '@xaendar/types';
import { LET_SYNTAX_ERROR } from '../../../lexer/states/lex-let/lex-let.state';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { LetToken } from '../../../lexer/types/tokens/let-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import type { ASTNode, MaybeASTNodeWithSpan } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { LetNode } from '../../types/nodes/let-node.type';
import { validateExpression } from '../../utils/expression-validator/expression-validator';
import { assertDeclaredName } from '../../utils/identifier/identifier.utils';

/**
 * Parses a `@let`, consuming the LET token and the LET_DECLARATION token following it, e.g.
 * `@let total = price() * quantity();`, into a `LetNode`: the value is validated as a template expression.
 *
 * @param cursor - Parser cursor positioned at the LET token.
 * @param _parseNode - Unused parser function (kept for signature consistency).
 * @param token - The LET token.
 * @returns The parsed `LetNode`.
 * @throws If the template ends before the `;` of the `@let`, the name is not valid, the value is missing or it is not a
 *   valid template expression.
 */
export function parseLet(cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: LetToken): MaybeASTNodeWithSpan<LetNode> {
  // consume LET
  cursor.advance();

  const declarationToken = cursor.peek();
  if (declarationToken.type !== TokenType.LET_DECLARATION) {
    throw LET_SYNTAX_ERROR;
  }

  // consume LET_DECLARATION
  cursor.advance();
  const [name, rawValue] = declarationToken.parts;
  const { start } = declarationToken.span;
  const nameSpan = { start, end: start + name.length };
  assertDeclaredName(name, nameSpan, '@let');

  const value = rawValue.trim();
  if (!value) {
    throw new Error(LET_SYNTAX_ERROR, { cause: declarationToken.span });
  }

  return {
    type: ASTNodeType.Let,
    name,
    nameSpan,
    value: validateExpression(value, cursor.findSpan(value, nameSpan.end).start).node,
    span: { start: token.span.start, end: declarationToken.span.end }
  };
}
