import { ASTNodeType } from '../node.enum';
import type { CatchNode } from './catch-node.type';

/**
 * AST node representing an `@error` block: what a `@defer` renders when the modules of its content fail to load, with
 * the error under the name the block gives it, as a `@catch` does.
 */
export type ErrorNode = Omit<CatchNode, 'type'> & {
  /**
   * Discriminant identifying this node as an error block.
   */
  type: ASTNodeType.Error;
};
