import type { Function } from '@xaendar/types'

/**
 * Describes a single DOM event listener to be attached to a rendered element.
 */
export type RenderElementEvent = {
  /**
   * The DOM event name (e.g. `click`, `input`).
   */
  name: string,
  /**
   * The listener: makes the call written in the template, receiving the event as `$event`.
   */
  handler: Function<[$event: Event], unknown>
}
