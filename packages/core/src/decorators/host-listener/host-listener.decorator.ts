import { parseKeyEvent, type KeyEventFilter } from '@xaendar/common';
import type { DecoratorMetadataContext } from '@xaendar/types';
import { INTERNAL_HOST_LISTENERS } from '../../costants';
import type { EventHost } from '../../types/event/event-host.type';
import type { HostListenerBinding } from '../../types/host/host-listener-binding.type';
import type { HostListenerDecorator } from '../../types/host/host-listener-decorator.type';
import type { HostListenerEvent } from '../../types/host/host-listener-event.type';
import type { HostListenerHandler } from '../../types/host/host-listener-handler.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { _addHostMetadata } from '../../utils/host-bindings/host-bindings.util';

/**
 * The prefixes naming the target of a listener other than the host element: `window:resize`, `document:keydown`.
 */
const TARGETS = ['window', 'document', 'visualViewport'];

/**
 * Decorator that listens to an event with a method, which receives the event: an event of the host element of a web
 * component or of a custom directive (the element it is applied to), or, with the prefix `window:` or `document:`, an
 * event of the window or of the document. A structural directive cannot declare it, since it holds no element.
 *
 * The listener is added each time the element is connected, or the directive started, and removed when the element is
 * disconnected, or the directive destroyed. On the host element it hears the native events of the element and the
 * events dispatched on it, the outputs of the component and of its directives included, and the events that bubble up
 * to it from its content.
 *
 * A key event names the key it listens to after a dot, as in templates and in Angular: `keydown.enter`,
 * `document:keydown.escape`, `keyup.control.shift.z`, `keydown.code.keya` (see `parseKeyEvent` of `@xaendar/common`). The
 * method is called only for that key, with exactly the modifiers named, and receives a `KeyboardEvent`.
 *
 * The type of the event the method receives follows the name: the event of `HTMLElementEventMap` for an event of the
 * host element (`MouseEvent` for `click`), of `WindowEventMap` after `window:`, of `DocumentEventMap` after `document:`,
 * and `Event` for any other name, e.g. an output, whose method may declare a narrower event, as `CustomEvent<number>`.
 * A method declaring an event unrelated to the one of the name, as `KeyboardEvent` for `click`, is a type error.
 *
 * @param name - The name of the event, prefixed by `window:` or `document:` to listen to the window or the document.
 * @param options - The options the listener is added with: `capture`, `once` and `passive`.
 * @returns A decorator for a method, not static.
 * @throws If the name, or what follows its prefix, is empty, if it is a key event naming no key or a modifier that does
 *   not exist, and, once applied, if the method is static.
 *
 * @example
 * ```ts
 * \@HostListener('click')
 * public toggle(event: MouseEvent): void {
 *   this.checked.update(checked => !checked);
 * }
 *
 * \@HostListener('window:resize')
 * public onResize(event: UIEvent): void {
 *   …
 * }
 *
 * \@HostListener('document:keydown.escape')
 * public close(event: KeyboardEvent): void {
 *   …
 * }
 *
 * \@HostListener('document:keydown', { passive: true })
 * public onKeydown(event: KeyboardEvent): void {
 *   …
 * }
 * ```
 */
export function HostListener<const Name extends string, This extends EventHost = EventHost>(name: Name, options?: HostListenerBinding['options']): HostListenerDecorator<This, HostListenerEvent<Name>> {
  const binding = toBinding(name, options);
  return (_value: unknown, context: DecoratorMetadataContext<ClassMethodDecoratorContext<This, HostListenerHandler<HostListenerEvent<Name>>>, WebComponentMetadata>): void => {
    if (context.static) {
      throw new Error(`@HostListener('${name}') cannot decorate the static method ${String(context.name)}`);
    }

    _addHostMetadata(context.metadata, INTERNAL_HOST_LISTENERS, Object.assign({ read: context.access.get }, binding));
  };
}

/**
 * Reads what the name given to `@HostListener` listens to: the target, the event, the key of a key event and the
 * options.
 *
 * @param name - The name given to `@HostListener`.
 * @param options - The options of the listener.
 * @returns The listener, without the method reading it.
 * @throws If the name, or what follows its prefix, is empty, or if it is a key event naming no key or a modifier that
 *   does not exist.
 */
function toBinding(name: string, options: HostListenerBinding['options']): Omit<HostListenerBinding, 'read'> {
  const target = TARGETS.find(prefix => name.startsWith(`${prefix}:`));
  const event = target ? name.slice(target.length + 1) : name;
  if (!event) {
    throw new Error(`@HostListener('${name}') names no event`);
  }

  let key: KeyEventFilter | undefined;
  try {
    key = parseKeyEvent(event);
  } catch (error) {
    throw new Error(`@HostListener('${name}'): ${(error as Error).message}`, { cause: error });
  }

  const binding: Omit<HostListenerBinding, 'read'> = key ? { name: key.event, options, key } : { name: event, options };
  return target ? Object.assign(binding, { target }) : binding;
}
