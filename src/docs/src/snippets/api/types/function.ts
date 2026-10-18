import type { Function } from '@xaendar/types';

/**
 * Compares two items for sorting: (first: Item, second: Item) => number
 */
type Comparator<Item> = Function<[first: Item, second: Item], number>;

/**
 * Sorts the users by name.
 */
const byName: Comparator<User> = (first, second) => first.name.localeCompare(second.name);

/**
 * The arguments of fetch, with another result: (input: RequestInfo | URL, init?: RequestInit) => Promise<unknown>
 */
type FetchJson = Function<Parameters<typeof fetch>, Promise<unknown>>;

/**
 * Fetches a resource and parses it as JSON.
 */
const fetchJson: FetchJson = async (input, init) => (await fetch(input, init)).json();
