import type { KeyEventFilter } from '@xaendar/common';
import type { EventHost } from '../event/event-host.type';
import type { HostListenerHandler } from './host-listener-handler.type';

/**
 * An event a web component or a custom directive listens to, declared by `@HostListener`: on its host element, or on
 * the window or the document.
 */
export type HostListenerBinding = {
  /**
   * The name of the event, without the prefix naming its target.
   */
  readonly name: string,
  /**
   * The target listened to instead of the host element: `window` or `document`, left out for the host element.
   */
  readonly target?: 'window' | 'document',
  /**
   * The options the listener is added with.
   */
  readonly options: Pick<AddEventListenerOptions, 'capture' | 'once' | 'passive'> | undefined,
  /**
   * The key the listener is filtered by, for a key event (`keydown.enter`): the method is called only for that key, with
   * exactly its modifiers. Left out for any other event.
   */
  readonly key?: KeyEventFilter,
  /**
   * Reads the decorated method of an instance, which handles the event.
   */
  readonly read: (owner: EventHost) => HostListenerHandler
};
