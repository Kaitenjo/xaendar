import type { SmallSet } from '../../types/small-set.type';
import type { SmallSetItem } from '../../types/small-set-item.type';

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
export function emptySmallSet<T extends SmallSetItem>(expectedSize = 0): SmallSet<T> {
  return expectedSize > ARRAY_LIMIT ? new Set() : EMPTY;
}

/**
 * Tells whether a `SmallSet` holds an item.
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`.
 * @param item - The item to look for.
 * @returns `true` if the set holds the item.
 */
export function smallSetHas<T extends SmallSetItem>(set: SmallSet<T>, item: T): boolean {
  if (Array.isArray(set)) {
    return set.includes(item);
  }

  return set instanceof Set ? set.has(item) : set === item;
}

/**
 * Returns the number of items of a `SmallSet`.
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`.
 * @returns The number of items.
 */
export function smallSetSize<T extends SmallSetItem>(set: SmallSet<T>): number {
  if (Array.isArray(set)) {
    return set.length;
  }

  return set instanceof Set ? set.size : 1;
}

/**
 * Adds an item to a `SmallSet`, after the ones it holds, unless it holds it already. The first item is kept as it is,
 * the second one makes an array of exactly two items (`[first, second]`: a push into an array of one would reserve room
 * for many more), the next ones are pushed into it, and the one beyond the limit of the array moves the items to a `Set`,
 * in the same order: a `Set` is kept even when the items decrease.
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`, changed in place when it is an array or a `Set` it stays.
 * @param item - The item to add.
 * @returns The `SmallSet` to store in place of the one given.
 */
export function addToSmallSet<T extends SmallSetItem>(set: SmallSet<T>, item: T): SmallSet<T> {
  if (set instanceof Set) {
    set.add(item);
    return set;
  }

  if (!Array.isArray(set)) {
    return set === item ? set : [set, item];
  }

  if (!set.length) {
    return item;
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
 * Removes an item from a `SmallSet`, keeping the order of the others: an array loses the item in place, the last item
 * left of an array is kept as it is, and the set becomes the shared empty one when the item was the last one.
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`, changed in place when it is an array keeping several items or a `Set`.
 * @param item - The item to remove.
 * @returns The `SmallSet` to store in place of the one given.
 */
export function deleteFromSmallSet<T extends SmallSetItem>(set: SmallSet<T>, item: T): SmallSet<T> {
  if (set instanceof Set) {
    set.delete(item);
    return set;
  }

  if (!Array.isArray(set)) {
    return set === item ? EMPTY : set;
  }

  const index = set.indexOf(item);
  if (index === -1) {
    return set;
  }

  if (set.length === 2) {
    return set[1 - index];
  }

  set.splice(index, 1);
  return set;
}

/**
 * Visits the items of a `SmallSet`, in insertion order.
 *
 * @template T - The type of the items.
 * @template Argument - What the visit receives besides the item.
 * @param set - The `SmallSet`.
 * @param visit - The visit, a function declared once, never a closure created for the visit.
 * @param argument - What the visit receives besides the item.
 */
export function forEachInSmallSet<T extends SmallSetItem, Argument>(set: SmallSet<T>, visit: (item: T, argument: Argument) => void, argument: Argument): void {
  if (Array.isArray(set)) {
    for (let i = 0; i < set.length; i++) {
      visit(set[i], argument);
    }
  } else if (set instanceof Set) {
    for (const item of set) {
      visit(item, argument);
    }
  } else {
    visit(set, argument);
  }
}

/**
 * Tells whether an item of a `SmallSet` satisfies a predicate, visiting them in insertion order until one does.
 *
 * @template T - The type of the items.
 * @template Argument - What the predicate receives besides the item.
 * @param set - The `SmallSet`.
 * @param predicate - The predicate, a function declared once, never a closure created for the visit.
 * @param argument - What the predicate receives besides the item.
 * @returns The first item satisfying the predicate, `undefined` when none does.
 */
export function findInSmallSet<T extends SmallSetItem, Argument>(set: SmallSet<T>, predicate: (item: T, argument: Argument) => boolean, argument: Argument): T | undefined {
  if (Array.isArray(set)) {
    for (let i = 0; i < set.length; i++) {
      if (predicate(set[i], argument)) {
        return set[i];
      }
    }

    return undefined;
  }

  if (set instanceof Set) {
    for (const item of set) {
      if (predicate(item, argument)) {
        return item;
      }
    }

    return undefined;
  }

  return predicate(set, argument) ? set : undefined;
}

/**
 * Copies the items of a `SmallSet` into a new array, in insertion order: what the introspection of the signals returns.
 *
 * @template T - The type of the items.
 * @param set - The `SmallSet`.
 * @returns The items.
 */
export function smallSetToArray<T extends SmallSetItem>(set: SmallSet<T>): T[] {
  if (Array.isArray(set)) {
    return set.slice();
  }

  return set instanceof Set ? Array.from(set) : [set];
}
