import { ASTNodeType } from '../node.enum.js';
import { ASTNode } from '../ast.type.js';

/**
 * AST node representing an `@for` iteration directive.
 */
export type ForNode = {
  /**
   * Discriminant identifying this node as a for loop.
   */
  type: ASTNodeType.For;
  /**
   * The iteration expression, e.g. `let item of items`.
   */
  expression: string;
  /**
   * Child nodes rendered for each iteration.
   */
  children: ASTNode[];
}
