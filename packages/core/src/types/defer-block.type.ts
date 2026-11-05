import type { HydrateBlock } from './hydrate-block.type';
import type { HydrateTrigger } from './hydrate-trigger.type';
import type { Block } from './if/block.type';
import type { TryBlock } from './try-block.type';

/**
 * A `@defer` block, as the compiler-generated render code describes it to `_defer`: each part is rendered before the
 * anchor it receives, getting its nodes with the strategy it receives, and returns the context owning them.
 */
export type DeferBlock = Pick<HydrateBlock, 'when' | 'load' | 'content'> & {
  /**
   * The triggers written by name, any of which renders the content: the ones of a `@hydrate` but `never`.
   */
  readonly triggers: ReadonlyArray<Exclude<HydrateTrigger, 'never'>>;
  /**
   * Renders the `@placeholder`, shown until a trigger fires, if the block declares one.
   */
  readonly placeholder?: Block['block'];
  /**
   * Renders the `@loading`, shown while the modules of the content load, if the block declares one.
   */
  readonly loading?: Block['block'];
  /**
   * Renders the `@error` with the error the modules failed to load with, if the block declares one.
   */
  readonly error?: TryBlock['catch'];
};
