/**
 * A method handling an event of the host element, declared by `@HostEvent`: it receives the event, and may be async.
 *
 * It is the type of a method signature, so that a method taking a narrower event (`(event: KeyboardEvent) => void`)
 * fits it, as methods compare their parameters bivariantly.
 */
export type HostEventHandler = {
  /**
   * Handles the event.
   *
   * @param event - The event.
   * @returns Anything: the result is ignored.
   */
  handle(event: Event): unknown
}['handle'];
