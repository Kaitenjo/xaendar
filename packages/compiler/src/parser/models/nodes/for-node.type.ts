import { ASTNodeType } from '../node.enum.js';
import { ASTNode } from '../ast.type.js';
import { ForExpression } from '../for-expression.type.js';

/**
 * AST node representing an `@for` iteration directive.
 */
export type ForNode = ForExpression & {
  /**
   * Discriminant identifying this node as a for loop.
   */
  type: ASTNodeType.For;
  /**
   * Child nodes rendered for each iteration.
   */
  children: ASTNode[];
}
