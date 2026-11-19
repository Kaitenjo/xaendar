import { loadSignals } from '@xaendar/signals';

/**
 * Defines `<ex-qty-picker>`.
 *
 * The component is imported here and not at the top of the file on purpose: `@xaendar/core` needs the global
 * `Signal` object as soon as its modules are evaluated, and a static import would be hoisted above the call
 * that installs it.
 *
 * @returns A promise resolved once the element is defined and can be created.
 */
export async function defineQtyPicker(): Promise<void> {
  loadSignals();
  await import('./qty-picker.xd.component');
}
