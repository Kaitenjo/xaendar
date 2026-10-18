import { computed, signal } from '@xaendar/core/signals';
import type { ExtractSignalType } from '@xaendar/signals';

/**
 * The filters of a list.
 */
const filters = signal({ query: '', done: false });
/**
 * How many filters are set.
 */
const active = computed(() => Number(filters().query !== '') + Number(filters().done));

/**
 * { query: string; done: boolean }, taken from the signal instead of written again.
 */
type Filters = ExtractSignalType<typeof filters>;
/**
 * never: a computed signal has no set(), so it is not a Signal.State.
 */
type Active = ExtractSignalType<typeof active>;

/**
 * Creates the filters showing every item.
 *
 * @returns The default filters.
 */
function defaultFilters(): Filters {
  return { query: '', done: false };
}

filters.set(defaultFilters());
