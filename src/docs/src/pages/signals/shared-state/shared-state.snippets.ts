import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `members.ts`, shown by the API reference of core-signals and the page signals/shared-state.
 */
export const MEMBERS: SourceFile = {
  name: 'members.ts',
  lang: 'ts',
  code: `import type { Signal } from '@xaendar/core/signals';
import { readCount } from './store';

// The template reads the signal itself by importing it: @import { count } from './store.ts'

/**
 * A badge showing a count shared by the whole application.
 */
export class BadgeComponent extends CustomElement {
  /**
   * ✗ A call to a function of the application: text interpolations work, but attribute bindings
   * are evaluated only once.
   */
  public readonly fromHelper = readCount();
  /**
   * ✓ The same call, annotated with its signal type: the compiler relies on the annotation.
   */
  public readonly annotated: Signal<number> = readCount();
}`
};

/**
 * The snippet `store.ts`, shown by the API reference of core-signals and the page signals/shared-state.
 */
export const STORE: SourceFile = {
  name: 'store.ts',
  lang: 'ts',
  code: `import { computed, signal } from '@xaendar/core/signals';
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
}`
};
