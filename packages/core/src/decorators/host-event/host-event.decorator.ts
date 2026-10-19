import type { DecoratorMetadataContext } from '@xaendar/types';
import { INTERNAL_HOST_EVENTS } from '../../costants';
import type { EventHost } from '../../types/event/event-host.type';
import type { HostEventDecorator } from '../../types/host/host-event-decorator.type';
import type { HostEventListener } from '../../types/host/host-event-listener.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { _addHostMetadata } from '../../utils/host-bindings/host-bindings.util';

/**
 * Decorator that listens to an event of the host element of a web component or of a custom directive (the element it is
 * applied to) with a method, which receives the event. A structural directive cannot declare it, since it holds no
 * element.
 *
 * The listener is added each time the element is connected, or the directive started, and removed when the element is
 * disconnected, or the directive destroyed. It hears the native events of the element and the events dispatched on it,
 * the outputs of the component and of its directives included, and the events that bubble up to it from its content.
 *
 * @param name - The name of the event.
 * @param options - The options the listener is added with: `capture`, `once` and `passive`.
 * @returns A decorator for a method, not static.
 * @throws If the name is empty, and, once applied, if the method is static.
 *
 * @example
 * ```ts
 * \@HostEvent('click')
 * public toggle(): void {
 *   this.checked.update(checked => !checked);
 * }
 *
 * \@HostEvent('keydown', { passive: true })
 * public onKeydown(event: KeyboardEvent): void {
 *   …
 * }
 * ```
 */
export function HostEvent<This extends EventHost, EventType extends Event>(name: string, options?: HostEventListener['options']): HostEventDecorator<This, EventType> {
  if (!name) {
    throw new Error('@HostEvent() names no event');
  }

  return (_value: unknown, context: DecoratorMetadataContext<ClassMethodDecoratorContext<This, (event: EventType) => unknown>, WebComponentMetadata>): void => {
    if (context.static) {
      throw new Error(`@HostEvent('${name}') cannot decorate the static method ${String(context.name)}`);
    }

    _addHostMetadata(context.metadata, INTERNAL_HOST_EVENTS, { name, options, read: context.access.get });
  };
}
