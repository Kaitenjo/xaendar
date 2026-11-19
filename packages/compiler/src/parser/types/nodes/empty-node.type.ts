import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing the `@empty` block following a `@for`, rendered while the `@for` has no items. Its content is a
 * scope of its own, in the scope holding the `@for`: it reads none of the variables of the `@for`.
 */
export type EmptyNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as the `@empty` of a `@for`.
   */
  type: ASTNodeType.Empty;
  /**
   * The content rendered while there are no items.
   */
  children: ASTNode[];
}>
