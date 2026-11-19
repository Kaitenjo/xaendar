import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing a `@loading` block: what a `@defer` renders from when a trigger fires until the modules of its
 * content are loaded.
 */
export type LoadingNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a loading block.
   */
  type: ASTNodeType.Loading;
  /**
   * The content of the block.
   */
  children: ASTNode[];
  /**
   * The time the modules load for before the block is shown, in milliseconds, if it declares one: `after 100ms`. When
   * they load sooner, the block is never shown.
   */
  after?: number;
  /**
   * The shortest time the block is shown, once shown, in milliseconds, if it declares one: `minimum 1s`.
   */
  minimum?: number;
}>
