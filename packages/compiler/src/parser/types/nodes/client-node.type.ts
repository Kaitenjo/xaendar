import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';
import type { PlaceholderNode } from './placeholder-node.type';

/**
 * AST node representing a `@client` block: content the server does not render, which the browser creates, in place of
 * the `@placeholder` the server rendered, if any.
 */
export type ClientNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a client block.
   */
  type: ASTNodeType.Client;
  /**
   * The content.
   */
  children: ASTNode[];
  /**
   * The block the server renders in place of the content, if any.
   */
  placeholder: PlaceholderNode | null;
}>
