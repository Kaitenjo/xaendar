import type { EventHost } from '../event/event-host.type';
import type { HostEventHandler } from './host-event-handler.type';

/**
 * An event a web component or a custom directive listens to on its host element, declared by `@HostEvent`.
 */
export type HostEventListener = {
  /**
   * The name of the event.
   */
  readonly name: string,
  /**
   * The options the listener is added with.
   */
  readonly options: Pick<AddEventListenerOptions, 'capture' | 'once' | 'passive'> | undefined,
  /**
   * Reads the decorated method of an instance, which handles the event.
   */
  readonly read: (owner: EventHost) => HostEventHandler
};
