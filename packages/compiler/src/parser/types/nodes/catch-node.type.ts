import type { Span } from '../../../types/span.type';
import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing a `@catch` block: what a `@try` renders when its content throws while it is first rendered.
 */
export type CatchNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a catch block.
   */
  type: ASTNodeType.Catch;
  /**
   * The name of the error in the content, `undefined` for a `@catch` without one, e.g. `error` in `@catch (error)`.
   */
  name?: string;
  /**
   * Span of the name.
   */
  nameSpan?: Span;
  /**
   * The content of the block.
   */
  children: ASTNode[];
}>
