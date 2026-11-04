import type { MethodDecorator } from '@xaendar/types';
import type { EventHost } from '../event/event-host.type';
import type { WebComponentMetadata } from '../web-component/web-component-metadata.type';

/**
 * The decorator `@HostEvent` returns: it decorates a method of a web component or of a custom directive, not static,
 * leaving it unchanged. The method receives the event, of the type its parameter declares, and may be async.
 */
export type HostEventDecorator<This extends EventHost, EventType extends Event> = (...args: Parameters<MethodDecorator<This, (event: EventType) => unknown, WebComponentMetadata>>) => void;
