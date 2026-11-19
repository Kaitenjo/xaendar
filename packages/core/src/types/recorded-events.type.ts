import type { NoArgsVoidFunction } from '@xaendar/types';

/**
 * The events recorded on content rendered on the server while it waits for its hydration, replayed once it is hydrated.
 */
export type RecordedEvents = {
  /**
   * The events, in the order they happened, each one with the node it was dispatched on, inside the shadow roots too.
   */
  events: Array<{ event: Event, target: EventTarget }>,
  /**
   * Stops recording the events.
   */
  stop: NoArgsVoidFunction
};
