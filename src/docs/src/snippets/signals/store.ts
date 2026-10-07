import { computed, signal } from '@xaendar/core/signals';
import type { Computed } from '@xaendar/core/signals';

// Private, writable state: only this module can change it
const items = signal<string[]>([]);

// Public, read-only views
export const count: Computed<number> = computed(() => items().length);
export const all: Computed<readonly string[]> = computed(() => items());

// Public operations
export function add(item: string): void {
  items.update(list => [...list, item]);
}
