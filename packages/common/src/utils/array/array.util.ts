/**
 * Removes the first occurrence of an item from an array, in place, comparing with `===` as `indexOf` does.
 *
 * @param array - The array to remove the item from.
 * @param item - The item to remove.
 * @returns `true` if the item was found and removed, `false` if the array does not contain it.
 */
export function removeItem<T>(array: T[], item: T): boolean {
  const index = array.indexOf(item);
  if (index === -1) {
    return false;
  }

  array.splice(index, 1);
  return true;
}
