import type { Signal } from '../signals';
import type { _Context } from '../utils/context/context.util';

/**
 * The rendering of an item of a `@for`, created by `_iterationVariables`: the context of its body, and the signals of
 * the variables it reads, which `_for` updates in place when the item is reused at another index or for another item
 * with the same key.
 *
 * N.B. Deliberate, to save memory: this object, two fields, is all a `@for` keeps for each item. The signals are kept
 * by position, in the order of `used` of the `IterationVariables` of the `@for`, which `_for` holds once and passes to the
 * function updating them, a single one declared at module level. Do not add an `update` closure, the names or the
 * aliases of the variables, or an object of the variables by name, to each entry.
 */
export type ForEntry = {
  /**
   * The context of the body of the item.
   */
  readonly context: _Context;
  /**
   * The signals of the variables the body reads, an array of the exact length of `used`, in its order. `null` when the
   * body reads none.
   */
  readonly signals: Array<Signal<unknown>> | null;
};
