/**
 * A method handling an event, declared by `@HostListener`: it receives the event, and may be async.
 *
 * It is the type of a method signature, so that a method taking a narrower event (`(event: CustomEvent<number>) => void`
 * for an event typed `Event`) fits it, as methods compare their parameters bivariantly, while a method taking an
 * unrelated event (`KeyboardEvent` for a `MouseEvent`) does not.
 *
 * @template EventType - The event the name of the listener gives (see `HostListenerEvent`).
 */
export type HostListenerHandler<EventType extends Event = Event> = {
  /**
   * Handles the event.
   *
   * @param event - The event.
   * @returns Anything: the result is ignored.
   */
  handle(event: EventType): unknown
}['handle'];
