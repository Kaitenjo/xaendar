import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing a `@placeholder` block: what the server renders in place of the content of a `@client`, and
 * what a `@defer` renders until a trigger fires.
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
  /**
   * The shortest time the `@placeholder` of a `@defer` is shown, in milliseconds, if it declares one: `minimum 500ms`.
   */
  minimum?: number;
}>
