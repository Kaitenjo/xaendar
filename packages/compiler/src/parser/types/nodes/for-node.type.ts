import { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ForExpression } from '../for-expression.type';
import { ASTNodeType } from '../node.enum';
import type { EmptyNode } from './empty-node.type';

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
  /**
   * The `@empty` following the block, rendered while there are no items, `null` without one.
   */
  empty: EmptyNode | null;
}>
