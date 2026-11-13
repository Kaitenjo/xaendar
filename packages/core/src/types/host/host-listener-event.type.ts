/**
 * The event a method decorated by `@HostListener` receives, given the name of the event: the event of
 * `HTMLElementEventMap` for an event of the host element (`MouseEvent` for `click`), of `WindowEventMap` after
 * `window:` (`UIEvent` for `window:resize`), of `DocumentEventMap` after `document:` (`KeyboardEvent` for
 * `document:keydown`), and `Event` for any other name, such as an output of a component.
 *
 * @template Name - The name given to `@HostListener`.
 */
export type HostListenerEvent<Name extends string> =
  Name extends `window:${infer EventName}`
    ? EventName extends keyof WindowEventMap ? WindowEventMap[EventName] : Event
    : Name extends `document:${infer EventName}`
      ? EventName extends keyof DocumentEventMap ? DocumentEventMap[EventName] : Event
      : Name extends keyof HTMLElementEventMap ? HTMLElementEventMap[Name] : Event;
