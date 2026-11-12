import type { NoArgsVoidFunction } from '@xaendar/types';
import type { _Context } from './context.type';
import type { DeferBlock } from './defer-block.type';
import type { DeferBlockState } from './defer-testing/defer-block-state.type';

/**
 * A `@defer` block while it is rendered (see `_defer`): where it is, and how far it got.
 */
export type DeferRun = {
  /**
   * The parent HTML element the block is rendered into.
   */
  readonly parentNode: HTMLElement;
  /**
   * The context owning the block.
   */
  readonly parentContext: _Context;
  /**
   * The comment the parts of the block are inserted before.
   */
  readonly anchor: Comment | null;
  /**
   * The triggers, the content and the blocks following it.
   */
  readonly block: DeferBlock;
  /**
   * Disarm the triggers armed, and dispose the effects of the `when` expressions.
   */
  readonly disarms: NoArgsVoidFunction[];
  /**
   * When the `@placeholder` has been shown for its minimum.
   */
  placeholderEnd: number;
  /**
   * When the `@loading` has been shown for its minimum, `0` while it is not shown.
   */
  loadingEnd: number;
  /**
   * Whether the context owning the block is not destroyed.
   */
  active: boolean;
  /**
   * Whether a trigger, or a test, rendered a part following the `@placeholder`.
   */
  fired: boolean;
  /**
   * Whether the modules loaded, or failed to.
   */
  settled: boolean;
  /**
   * The part shown.
   */
  state: DeferBlockState;
  /**
   * The slot of the container of the block in the context owning it (see `_ScopeLayout`), holding the context of the
   * part shown, `null` when none is.
   */
  readonly slot: number;
  /**
   * The load of the modules of the content, once started.
   */
  loaded?: Promise<unknown>;
};
