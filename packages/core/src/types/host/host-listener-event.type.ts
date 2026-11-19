import type { HostListenerEventName } from './host-listener-event-name.type';

/**
 * The event a method decorated by `@HostListener` receives, given the name of the event: the event of
 * `HTMLElementEventMap` for an event of the host element (`MouseEvent` for `click`), of `WindowEventMap` after
 * `window:` (`UIEvent` for `window:resize`), of `DocumentEventMap` after `document:` (`KeyboardEvent` for
 * `document:keydown`), and `Event` for any other name, such as an output of a component. A key event is typed by its
 * event (`KeyboardEvent` for `keydown.enter` and `document:keydown.escape`).
 *
 * @template Name - The name given to `@HostListener`.
 */
export type HostListenerEvent<Name extends string> =
  Name extends `window:${infer EventName}`
    ? HostListenerEventName<EventName> extends keyof WindowEventMap ? WindowEventMap[HostListenerEventName<EventName>] : Event
    : Name extends `document:${infer EventName}`
      ? HostListenerEventName<EventName> extends keyof DocumentEventMap ? DocumentEventMap[HostListenerEventName<EventName>] : Event
      : HostListenerEventName<Name> extends keyof HTMLElementEventMap ? HTMLElementEventMap[HostListenerEventName<Name>] : Event;
