import { NoArgsFunction } from '@xaendar/types';
import { InterpolationExpressionToken } from '../../../lexer/types/tokens/interpolation-expression-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import { InterpolationNode } from '../../types/nodes/interpolation-node.type';
import { validateExpression } from '../../utils/expression-validator/expression-validator';
import { parseCast } from '../parse-cast/parse-cast.state';

/**
 * Parses an interpolation expression token, and the CAST token closing the interpolation if any, into an
 * `InterpolationNode`.
 *
 * @param cursor - Parser cursor; advanced past the interpolation token and its cast.
 * @param _parseNode - Unused parser function (kept for signature consistency).
 * @param token - The INTERPOLATION_EXPRESSION token.
 * @returns The parsed `InterpolationNode`.
 */
export function parseInterpolation(cursor: ParserCursor, _parseNode: NoArgsFunction<ASTNode | undefined>, token: InterpolationExpressionToken): InterpolationNode {
  const startOffset = token.span.start;
  cursor.advance();
  const expression = validateExpression(token.parts[0], cursor.findSpan(token.parts[0], startOffset).start).node;
  const cast = parseCast(cursor);

  const node: InterpolationNode = {
    type: ASTNodeType.Interpolation,
    expression,
    span: {
      start: startOffset,
      end: cursor.getCurrentToken().value.span.end,
    },
  };

  if (cast) {
    node.cast = cast;
  }

  return node;
}
