import type { DecoratorMetadataContext } from '@xaendar/types';
import { INTERNAL_HOST_PROPERTIES } from '../../costants';
import type { EventHost } from '../../types/event/event-host.type';
import type { HostPropertyDecorator } from '../../types/host/host-property-decorator.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { _addHostMetadata } from '../../utils/host-bindings/host-bindings.util';

/**
 * The prefix of the name of a class binding (`class.name`).
 */
const CLASS_PREFIX = 'class.';

/**
 * Decorator that binds an attribute, or a class, of the host element of a web component or of a custom directive (the
 * element it is applied to) to a field, a getter or an accessor. A structural directive cannot declare it, since it
 * holds no element.
 *
 * The member is read each time the element is connected, or the directive started, and again whenever a signal it reads
 * changes: a member that reads no signal is written once. A field holding a signal, or any other function, is called to
 * get the value. `null`, `undefined` and `false` remove the attribute, `true` writes it empty, any other value is
 * written as a string. A name starting with `class.` toggles the class that follows, as `[class.name]` does in a
 * template: the element has it while the value is truthy. When the element is disconnected, or the directive
 * destroyed, the attribute is removed and the class taken away.
 *
 * @param name - The name of the attribute, or `class.` followed by the name of the class.
 * @returns A decorator for a field, a getter or an accessor, not static.
 * @throws If the name is empty, or `class.` is followed by no class, and, once applied, if the member is static.
 *
 * @example
 * ```ts
 * \@HostProperty('role')
 * public readonly role = 'switch';
 *
 * \@HostProperty('aria-checked')
 * public readonly checked = signal(false);
 *
 * \@HostProperty('class.disabled')
 * public get disabled(): boolean {
 *   return this.busy() || this.locked();
 * }
 * ```
 */
export function HostProperty(name: string): HostPropertyDecorator {
  const isClass = name.startsWith(CLASS_PREFIX);
  const target = isClass ? name.slice(CLASS_PREFIX.length) : name;
  if (!target) {
    throw new Error(`@HostProperty('${name}') names no ${isClass ? 'class' : 'attribute'}`);
  }

  return (_value: unknown, context: DecoratorMetadataContext<ClassFieldDecoratorContext<EventHost> | ClassGetterDecoratorContext<EventHost> | ClassAccessorDecoratorContext<EventHost>, WebComponentMetadata>): void => {
    if (context.static) {
      throw new Error(`@HostProperty('${name}') cannot decorate the static member ${String(context.name)}`);
    }

    _addHostMetadata(context.metadata, INTERNAL_HOST_PROPERTIES, { name: target, isClass, read: context.access.get });
  };
}
