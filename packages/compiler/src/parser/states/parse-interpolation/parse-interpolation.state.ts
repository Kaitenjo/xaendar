import { NoArgsFunction } from '@xaendar/types';
import { InterpolationExpressionToken } from '../../../lexer/types/tokens/interpolation-expression-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import { InterpolationNode } from '../../types/nodes/interpolation-node.type';
import { validateExpression } from '../../utils/expression-validator/expression-validator';

/**
 * Parses an interpolation expression token into an `InterpolationNode`.
 *
 * @param cursor - Parser cursor; advanced past the interpolation token.
 * @param _parseNode - Unused parser function (kept for signature consistency).
 * @param token - The INTERPOLATION_EXPRESSION token.
 * @returns The parsed `InterpolationNode`.
 */
export function parseInterpolation(cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: InterpolationExpressionToken): InterpolationNode {
  const startOffset = token.span.start;
  cursor.advance();
  
  return {
    type: ASTNodeType.Interpolation,
    expression: validateExpression(token.parts[0]).node,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end,
    },
  };
}
