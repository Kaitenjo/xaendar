/**
 * What a `SmallSet` can hold: an object that is not iterable, as the nodes and the watchers of the signals are, so that
 * an item alone, which the set keeps as it is, is never taken for an array or a `Set` of items. A primitive, an array or
 * a `Set` does not fit it: TypeScript rejects them.
 */
export type SmallSetItem = object & {
  /**
   * An item is not iterable.
   */
  readonly [Symbol.iterator]?: never;
};
