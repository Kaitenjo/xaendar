/**
 * A set of items kept in an array while it holds few of them, and in a `Set` beyond: an array holding one or two items
 * takes far less memory than the hash table of a `Set`. It is changed through the functions of `small-set.util`, which
 * return the value to store, and read as it is: iterated in insertion order (`for…of`, spread) like an array or a `Set`.
 *
 * @template T - The type of the items.
 */
export type SmallSet<T> = T[] | Set<T>;
