import type { Function, NoArgsFunction } from '@xaendar/types';
import type { _Context } from '../utils/context/context.util';
import type { IterationVariables } from './iteration-variables.type';
import type { NodeBlock } from './node-block.type';
import type { NodeStrategy } from './node-strategy.type';
import type { TrackExpression } from './track-expression.type';

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
   * Returns the items: an array, or a number `n`, iterated as `0, 1, ..., n - 1`.
   */
  readonly condition: NoArgsFunction<unknown[] | number>;
  /**
   * Returns the key of an item.
   */
  readonly trackExpression: TrackExpression;
  /**
   * Renders a new item, returning the context of its body.
   */
  readonly forFn: Function<[HTMLElement, _Context, unknown[], number, Node | null, NodeStrategy], _Context>;
  /**
   * The variables the body reads, declared in the context of each item: `undefined` when the body reads none.
   */
  readonly variables: IterationVariables | undefined;
  /**
   * The contexts of the items of each key, in the order of the items: a key repeated in the items has a context per
   * occurrence. `null` until the first render.
   *
   * N.B. Deliberate, to save memory: the context of the body of an item is all a `@for` keeps for it, its variables
   * being values the context declares. Do not wrap it in an object of its own, nor add a closure updating it.
   */
  entries: Map<string | number, _Context[]> | null;
};
