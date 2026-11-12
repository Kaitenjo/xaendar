import type { _Context } from './context.type';
import type { ForConfig } from './for-config.type';
import type { NodeBlock } from './node-block.type';

/**
 * A `@for` while it is rendered (see `_for`): where it is, how its items are got and rendered, and the ones it renders,
 * held by its binding as the argument of its callback.
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
   * The contexts of the items of each key, in the order of the items: a key repeated in the items has a context per
   * occurrence. `null` until the first render.
   *
   * N.B. Deliberate, to save memory: the context of the body of an item is all a `@for` keeps for it, its variables
   * being values the context declares. Do not wrap it in an object of its own, nor add a closure updating it.
   */
  entries: Map<string | number, _Context[]> | null;
};
