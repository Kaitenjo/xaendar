import type { SmallSet } from '../../types/small-set.type';

/**
 * The number of items a `SmallSet` keeps in an array: adding one more moves them to a `Set`, whose lookup does not grow
 * with the items.
 */
const ARRAY_LIMIT = 32;

/**
 * The `SmallSet` holding no item, shared by every empty one: frozen, since the functions never change an empty array.
 */
const EMPTY: never[] = Object.freeze([]) as never[];

/**
 * Returns an empty `SmallSet`: the shared frozen empty array, so that an empty set allocates nothing, or a `Set` when it
 * is expected to hold more items than an array keeps.
 *
 * @template T - The type of the items.
 * @param expectedSize - The number of items the set is expected to hold, e.g. the size of the set it replaces: beyond
 *   the limit of the array it starts as a `Set`, without filling an array first.
 * @returns The empty `SmallSet`.
 */
export function emptySmallSet<T>(expectedSize = 0): SmallSet<T> {
  return expectedSize > ARRAY_LIMIT ? new Set() : EMPTY;
}

/**
 * Tells whether a `SmallSet` holds an item, compared as a `Set` does (`NaN` equals `NaN`).
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`.
 * @param item - The item to look for.
 * @returns `true` if the set holds the item.
 */
export function smallSetHas<T>(set: SmallSet<T>, item: T): boolean {
  return Array.isArray(set) ? set.includes(item) : set.has(item);
}

/**
 * Returns the number of items of a `SmallSet`.
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`.
 * @returns The number of items.
 */
export function smallSetSize<T>(set: SmallSet<T>): number {
  return Array.isArray(set) ? set.length : set.size;
}

/**
 * Adds an item to a `SmallSet`, after the ones it holds, unless it holds it already. The first item makes an array of
 * its own (`[item]`), the next ones are pushed into it, and the one beyond the limit of the array moves the items to a
 * `Set`, in the same order: a `Set` is kept even when the items decrease.
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`, changed in place unless it is empty or moves to a `Set`.
 * @param item - The item to add.
 * @returns The `SmallSet` to store in place of the one given.
 */
export function addToSmallSet<T>(set: SmallSet<T>, item: T): SmallSet<T> {
  if (!Array.isArray(set)) {
    set.add(item);
    return set;
  }

  // An empty set gets an array of exactly one item: a push would reserve room for many more
  if (!set.length) {
    return [item];
  }

  if (set.includes(item)) {
    return set;
  }

  if (set.length < ARRAY_LIMIT) {
    set.push(item);
    return set;
  }

  return new Set(set).add(item);
}

/**
 * Removes an item from a `SmallSet`, keeping the order of the others: an array loses the item in place, and becomes the
 * shared empty one when it was the last item.
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`, changed in place unless its last item is removed.
 * @param item - The item to remove, compared as a `Set` does (`NaN` equals `NaN`).
 * @returns The `SmallSet` to store in place of the one given.
 */
export function deleteFromSmallSet<T>(set: SmallSet<T>, item: T): SmallSet<T> {
  if (!Array.isArray(set)) {
    set.delete(item);
    return set;
  }

  // indexOf never finds NaN, which a Set holds
  const index = item === item ? set.indexOf(item) : set.findIndex(value => value !== value);
  if (index === -1) {
    return set;
  }

  if (set.length === 1) {
    return EMPTY;
  }

  set.splice(index, 1);
  return set;
}
