import { computed, signal } from '@xaendar/core/signals';
import type { Computed } from '@xaendar/core/signals';

/**
 * Private, writable state: only this module can change it.
 */
const items = signal<string[]>([]);

/**
 * Public, read-only view: how many items there are.
 */
export const count: Computed<number> = computed(() => items().length);

/**
 * Public, read-only view: every item.
 */
export const all: Computed<readonly string[]> = computed(() => items());

/**
 * Public operation: adds an item.
 *
 * @param item - The item to add.
 */
export function add(item: string): void {
  items.update(list => [...list, item]);
}
