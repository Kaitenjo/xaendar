import type { NoArgsFunction } from '@xaendar/types';
import type { HydrateTrigger } from './hydrate-trigger.type';
import type { Block } from './if/block.type';

/**
 * A `@hydrate` block, as the compiler-generated render code describes it to `_hydrate`: the content is rendered before
 * the anchor it receives, getting its nodes with the strategy it receives.
 */
export type HydrateBlock = {
  /**
   * The triggers written by name, any of which hydrates the content.
   */
  triggers: HydrateTrigger[],
  /**
   * The expression of the `when` trigger, which fires once it is truthy, if the block declares one.
   */
  when?: NoArgsFunction<unknown>,
  /**
   * Loads the modules of the components only the content renders, if any: the content is rendered once they are loaded.
   */
  load?: NoArgsFunction<Promise<unknown>>,
  /**
   * Renders the content.
   */
  content: Block['block']
};
