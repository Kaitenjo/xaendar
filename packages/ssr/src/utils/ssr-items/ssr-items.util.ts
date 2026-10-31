/**
 * Returns the items a `@for` iterates, as the client iterates them: the items of an array, or `0, 1, …, n - 1` for a
 * number `n`.
 *
 * @param iterable - The value of the iterable expression of the `@for`.
 * @returns The items.
 */
export function _ssrItems(iterable: unknown[] | number): unknown[] {
  return typeof iterable === 'number' ? Array.from({ length: iterable }, (_item, index) => index) : iterable;
}
