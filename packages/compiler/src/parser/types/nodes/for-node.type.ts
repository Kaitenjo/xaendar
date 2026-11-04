import { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ForExpression } from '../for-expression.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing an `@for` iteration directive.
 */
export type ForNode = ASTNodeWithSpan<ForExpression & {
  /**
   * Discriminant identifying this node as a for loop.
   */
  type: ASTNodeType.For;
  /**
   * Child nodes rendered for each iteration.
   */
  children: ASTNode[];
}>
