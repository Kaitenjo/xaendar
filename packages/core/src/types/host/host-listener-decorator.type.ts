import type { MethodDecorator } from '@xaendar/types';
import type { EventHost } from '../event/event-host.type';
import type { WebComponentMetadata } from '../web-component/web-component-metadata.type';
import type { HostListenerHandler } from './host-listener-handler.type';

/**
 * The decorator `@HostListener` returns: it decorates a method of a web component or of a custom directive, not
 * static, leaving it unchanged. The method receives the event the name of the listener gives (see `HostListenerEvent`),
 * or a narrower one, and may be async.
 *
 * @template This - The class declaring the method.
 * @template EventType - The event the name of the listener gives.
 */
export type HostListenerDecorator<This extends EventHost, EventType extends Event> = (...args: Parameters<MethodDecorator<This, HostListenerHandler<EventType>, WebComponentMetadata>>) => void;
