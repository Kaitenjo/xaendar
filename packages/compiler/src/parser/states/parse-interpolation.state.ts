import { ASTNodeType } from '../models/node.enum.js';
import { ParserContext } from '../models/parser-context.type.js';
import { ParserCursor } from '../models/parser-cursor.model.js';
import { InterpolationExpressionToken } from '../../lexer/models/tokens/interpolation-expression-token.type.js';
import { InterpolationLiteralToken } from '../../lexer/models/tokens/interpolation-literal-token.type.js';
import { InterpolationNode } from '../models/nodes/interpolation-node.type.js';

/**
 * Parses an interpolation expression or literal token into an `InterpolationNode`.
 *
 * @param cursor Parser cursor; advanced past the interpolation token.
 * @param _context Unused parser context.
 * @param token The INTERPOLATION_EXPRESSION or INTERPOLATION_LITERAL token.
 * @returns The parsed `InterpolationNode`.
 */
export function parseInterpolation(cursor: ParserCursor, _context: ParserContext, token: InterpolationExpressionToken | InterpolationLiteralToken): InterpolationNode {
  cursor.advance();
  return {
    type: ASTNodeType.Interpolation,
    expression: token.parts[0]
  };
}
