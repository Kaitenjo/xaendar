import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing a `@placeholder` block: what the server renders in place of the content of a `@client`.
 */
export type PlaceholderNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a placeholder block.
   */
  type: ASTNodeType.Placeholder;
  /**
   * The content of the block.
   */
  children: ASTNode[];
}>
