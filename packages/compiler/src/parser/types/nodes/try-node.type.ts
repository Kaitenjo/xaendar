import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';
import type { CatchNode } from './catch-node.type';

/**
 * AST node representing a `@try` block, with the `@catch` following it: when the content throws while it is first
 * rendered, the catch is rendered in its place, as in JavaScript.
 */
export type TryNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a try block.
   */
  type: ASTNodeType.Try;
  /**
   * The content.
   */
  children: ASTNode[];
  /**
   * The block rendered in place of the content when it throws.
   */
  catch: CatchNode;
}>
