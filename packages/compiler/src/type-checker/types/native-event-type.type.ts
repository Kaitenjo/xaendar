import type { Function } from '@xaendar/types';

/**
 * Builds the type of `$event` for a native event of an element, given the name of the event: indexing the event map
 * of the element, e.g. `HTMLElementEventMap['click']`, and falling back to `any` for a custom element of another library.
 */
export type NativeEventType = Function<[name: string], string>;
