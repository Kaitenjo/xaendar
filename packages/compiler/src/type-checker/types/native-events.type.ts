import type { ElementEventMap } from './element-event-map.type';

/**
 * What types the native events of an element, and of the directives applied to it: the event map of its namespace,
 * whether it is a custom element of another library, and its tag name, which the warnings name.
 */
export type NativeEvents = {
  /**
   * The event map typing `$event` by the name of the event, e.g. `HTMLElementEventMap['click']`.
   */
  readonly eventMap: ElementEventMap;
  /**
   * The tag name of the element.
   */
  readonly tagName: string;
  /**
   * Whether the element is a custom element of another library (`customElements`): an event its map does not declare
   * types `$event` as `any`, and its name is not checked, since the element may dispatch events of its own.
   */
  readonly foreign: boolean;
};
