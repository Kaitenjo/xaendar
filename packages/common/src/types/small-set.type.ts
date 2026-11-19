import type { SmallSetItem } from './small-set-item.type';

/**
 * A set of items kept as the item itself while it holds one, in an array while it holds few of them, and in a `Set`
 * beyond: an item alone takes no memory of its own, and an array holding two items far less than the hash table of a
 * `Set`. Empty, it is a shared frozen empty array. It is changed through the functions of `small-set.util`, which return
 * the value to store, and read through them (`forEachInSmallSet`, `smallSetToArray`): an item alone is not iterable.
 *
 * N.B. Deliberate, to save memory: the nodes of the signals have one or two sources and sinks, a watcher one or two
 * signals, so that the item alone, instead of an array holding it, saves an array per set, three per effect. The items
 * are objects that are neither arrays nor `Set`s (see `SmallSetItem`), so that an item alone is told apart from the
 * collections. Do not go back to an array of a single item.
 *
 * @template T - The type of the items.
 */
export type SmallSet<T extends SmallSetItem> = T | T[] | Set<T>;
