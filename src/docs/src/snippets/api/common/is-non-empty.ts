import { isNonEmpty } from '@xaendar/common';
import type { RequireOne } from '@xaendar/types';

/**
 * The filters of a search, each one optional.
 */
type Filters = {
  /**
   * A text the name contains.
   */
  name?: string;
  /**
   * A tag of the item.
   */
  tag?: string;
};

/**
 * Runs a search. Without filters it would return every item, so it needs at least one.
 *
 * @param filters - The filters, at least one of them.
 */
function search(filters: RequireOne<Filters>): void {
  console.log('Searching', filters);
}

/**
 * Searches with the filters typed in a form, if any.
 *
 * @param filters - The filters typed in the form.
 */
function submit(filters: Filters): void {
  search(filters);   // ✗ Argument of type 'Filters' is not assignable to parameter of type 'RequireOne<Filters>'.
  if (isNonEmpty(filters)) {
    search(filters); // ✓ here filters has at least one key
  }
}

isNonEmpty({ name: undefined }); // true: a key counts, whatever its value
