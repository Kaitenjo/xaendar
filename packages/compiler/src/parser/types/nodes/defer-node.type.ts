import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import type { DeferTrigger } from '../defer-trigger.type';
import { ASTNodeType } from '../node.enum';
import type { ErrorNode } from './error-node.type';
import type { LoadingNode } from './loading-node.type';
import type { PlaceholderNode } from './placeholder-node.type';

/**
 * AST node representing a `@defer` block: content rendered, and the modules of the components only it renders loaded,
 * once a trigger fires, with the blocks following it.
 */
export type DeferNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a defer block.
   */
  type: ASTNodeType.Defer;
  /**
   * The triggers, any of which renders the content.
   */
  triggers: DeferTrigger[];
  /**
   * The content.
   */
  children: ASTNode[];
  /**
   * The block rendered until a trigger fires, the only one the server renders, if any.
   */
  placeholder: PlaceholderNode | null;
  /**
   * The block rendered while the modules of the content load, if any.
   */
  loading: LoadingNode | null;
  /**
   * The block rendered when the modules of the content fail to load, if any.
   */
  error: ErrorNode | null;
}>
