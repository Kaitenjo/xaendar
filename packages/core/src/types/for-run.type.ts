import type { _Context } from './context.type';
import type { ForConfig } from './for-config.type';
import type { NodeBlock } from './node-block.type';

/**
 * A `@for` while it is rendered (see `_for`): where it is, how its items are got and rendered, and the ones it renders,
 * held by its binding as the argument of its callback, and by the container of the `@for` in the scope rendering it (see
 * `_ScopeLayout`), through which the scope clears and refreshes its rows.
 *
 * N.B. Deliberate, to save memory: the state of a `@for` lives in this object, passed to `runFor`, a function declared
 * once at module level, instead of local variables of `_for` captured by an arrow created per `@for`, which would cost a
 * closure and its context for each one. Do not move it back into a closure.
 */
export type ForRun = {
  /**
   * The parent HTML element the items are rendered into.
   */
  readonly parentNode: HTMLElement;
  /**
   * The context owning the items.
   */
  readonly parentContext: _Context;
  /**
   * The block, as the node strategy opened it.
   */
  readonly nodeBlock: NodeBlock;
  /**
   * The `@for`, a constant of the module of the template: the items, their keys, the body and the variables it reads.
   */
  readonly config: ForConfig;
  /**
   * The contexts of the bodies of the items, in the order of the items: `null` until the first render.
   *
   * N.B. Deliberate, to save memory: the context of the body of an item is all a `@for` keeps for it, its variables
   * being values the context declares, in an array of the exact number of the items, beside the one of their keys,
   * created again by each run. A run reconciling the rows finds the ones to reuse through a `Map` of its own, dropped
   * once it is done, instead of a `Map` kept between the runs holding an array per key, which cost a `Map` per `@for`
   * and an array per row. Do not keep a `Map` of the rows, wrap a context in an object of its own, nor add a closure
   * updating it.
   */
  rows: _Context[] | null;
  /**
   * The key of each item, in the order of the items, the one of the row at the same index of {@link rows}: a key
   * repeated in the items has a row per occurrence. `null` until the first render.
   */
  keys: Array<string | number> | null;
};
