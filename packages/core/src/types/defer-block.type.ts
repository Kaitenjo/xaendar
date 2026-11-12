import type { HydrateBlock } from './hydrate-block.type';
import type { Block } from './if/block.type';
import type { Trigger } from './triggers/trigger.type';
import type { TryBlock } from './try-block.type';

/**
 * A `@defer` block, as the compiler-generated render code describes it to `_defer`: each part is rendered before the
 * anchor it receives, getting its nodes with the strategy it receives, and returns the context owning them.
 */
export type DeferBlock = Pick<HydrateBlock, 'when' | 'whenReads' | 'load' | 'prefetchWhen' | 'prefetchWhenReads' | 'content' | 'last' | 'slot'> & {
  /**
   * The triggers written by name or with their arguments, any of which renders the content: the ones of a `@hydrate`
   * but `never`.
   */
  readonly triggers: ReadonlyArray<Exclude<Trigger, 'never'>>;
  /**
   * The triggers following `prefetch`, any of which loads the modules of the content without rendering it, if the block
   * declares some and has modules to load.
   */
  readonly prefetch?: ReadonlyArray<Exclude<Trigger, 'never'>>;
  /**
   * Renders the `@placeholder`, shown until a trigger fires, if the block declares one.
   */
  readonly placeholder?: Block['block'];
  /**
   * The shortest time the `@placeholder` is shown, in milliseconds, if it declares one.
   */
  readonly placeholderMinimum?: number;
  /**
   * Renders the `@loading`, shown while the modules of the content load, if the block declares one.
   */
  readonly loading?: Block['block'];
  /**
   * The time the modules load for before the `@loading` is shown, in milliseconds, if it declares one.
   */
  readonly loadingAfter?: number;
  /**
   * The shortest time the `@loading` is shown, once shown, in milliseconds, if it declares one.
   */
  readonly loadingMinimum?: number;
  /**
   * Renders the `@error` with the error the modules failed to load with, if the block declares one.
   */
  readonly error?: TryBlock['catch'];
};
