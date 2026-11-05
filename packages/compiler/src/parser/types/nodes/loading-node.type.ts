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
}>
