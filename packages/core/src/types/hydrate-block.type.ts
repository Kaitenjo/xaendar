import type { NoArgsFunction } from '@xaendar/types';
import type { Block } from './if/block.type';
import type { Trigger } from './triggers/trigger.type';

/**
 * A `@hydrate` block, as the compiler-generated render code describes it to `_hydrate`: the content is rendered before
 * the anchor it receives, getting its nodes with the strategy it receives.
 */
export type HydrateBlock = {
  /**
   * The triggers written by name or with their arguments, any of which hydrates the content.
   */
  triggers: Trigger[],
  /**
   * The expression of the `when` trigger, which fires once it is truthy, if the block declares one.
   */
  when?: NoArgsFunction<unknown>,
  /**
   * Loads the modules of the components only the content renders, if any: the content is rendered once they are loaded.
   */
  load?: NoArgsFunction<Promise<unknown>>,
  /**
   * The triggers following `prefetch`, any of which loads the modules of the content without rendering it, if the block
   * declares some and has modules to load.
   */
  prefetch?: Trigger[],
  /**
   * The expression of the `when` trigger following `prefetch`, which loads the modules of the content once it is truthy,
   * if the block declares one and has modules to load.
   */
  prefetchWhen?: NoArgsFunction<unknown>,
  /**
   * Renders the content.
   */
  content: Block['block']
};
