import type { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import type { DeferTrigger } from '../triggers/defer-trigger.type';
import type { HydrateTrigger } from '../triggers/hydrate-trigger.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing a `@hydrate` block: content rendered on the server whose hydration in the browser waits for a
 * trigger. A page rendered in the browser renders it as if the block were not there.
 */
export type HydrateNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a hydrate block.
   */
  type: ASTNodeType.Hydrate;
  /**
   * The triggers, any of which hydrates the content: none waits for the browser to be idle.
   */
  triggers: HydrateTrigger[];
  /**
   * The triggers written after `prefetch`, any of which loads the modules of the content without hydrating it.
   */
  prefetch: DeferTrigger[];
  /**
   * The content.
   */
  children: ASTNode[];
}>
