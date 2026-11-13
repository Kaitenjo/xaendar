import type { DecoratorMetadataContext } from '@xaendar/types';
import { INTERNAL_HOST_PROPERTIES } from '../../costants';
import type { EventHost } from '../../types/event/event-host.type';
import type { HostPropertyBinding } from '../../types/host/host-property-binding.type';
import type { HostPropertyDecorator } from '../../types/host/host-property-decorator.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { _addHostMetadata } from '../../utils/host-bindings/host-bindings.util';

/**
 * The prefix of the name of a class binding (`class.name`).
 */
const CLASS_PREFIX = 'class.';

/**
 * The prefix of the name of a style binding (`style.name`).
 */
const STYLE_PREFIX = 'style.';

/**
 * Matches the name of a style property and its unit, if any, as `[style.name]` does in a template: `width` and `px`
 * in `width.px`, `backgroundColor` in `backgroundColor`.
 */
const STYLE_PROPERTY_RE = /^([a-zA-Z][a-zA-Z-]*)(?:\.([a-z]+|%))?$/;

/**
 * Decorator that binds an attribute, or a class, of the host element of a web component or of a custom directive (the
 * element it is applied to) to a field, a getter or an accessor. A structural directive cannot declare it, since it
 * holds no element.
 *
 * The member is read each time the element is connected, or the directive started, and again whenever a signal it reads
 * changes: a member that reads no signal is written once. A field holding a signal, or any other function, is called to
 * get the value. `null`, `undefined` and `false` remove the attribute, `true` writes it empty, any other value is
 * written as a string. A name starting with `class.` toggles the class that follows, as `[class.name]` does in a
 * template: the element has it while the value is truthy. A name starting with `style.` sets the style property that
 * follows, as `[style.name]` does in a template: in kebab-case or in camelCase, followed by its unit, if any
 * (`style.width.px`), or a custom property (`style.--accent`); `null`, `undefined` and `false` remove it. When the
 * element is disconnected, or the directive destroyed, the attribute is removed, the class taken away and the style
 * property removed.
 *
 * @param name - The name of the attribute, `class.` followed by the name of the class, or `style.` followed by the name
 *   of the style property and its unit, if any.
 * @returns A decorator for a field, a getter or an accessor, not static.
 * @throws If the name is empty, `class.` is followed by no class, `style.` by no style property, and, once applied, if
 *   the member is static.
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
 *
 * \@HostProperty('style.width.px')
 * public readonly width = signal(120);
 * ```
 */
export function HostProperty(name: string): HostPropertyDecorator {
  const binding = toBinding(name);
  return (_value: unknown, context: DecoratorMetadataContext<ClassFieldDecoratorContext<EventHost> | ClassGetterDecoratorContext<EventHost> | ClassAccessorDecoratorContext<EventHost>, WebComponentMetadata>): void => {
    if (context.static) {
      throw new Error(`@HostProperty('${name}') cannot decorate the static member ${String(context.name)}`);
    }

    _addHostMetadata(context.metadata, INTERNAL_HOST_PROPERTIES, Object.assign({ read: context.access.get }, binding));
  };
}

/**
 * Reads what the name given to `@HostProperty` binds: an attribute, a class, or a style property and its unit.
 *
 * @param name - The name given to `@HostProperty`.
 * @returns The name of what is bound, its kind and, for a style property, its unit, if any.
 * @throws If the name is empty, `class.` is followed by no class, or `style.` by no style property.
 */
function toBinding(name: string): Omit<HostPropertyBinding, 'read'> {
  if (name.startsWith(CLASS_PREFIX)) {
    const className = name.slice(CLASS_PREFIX.length);
    if (!className) {
      throw new Error(`@HostProperty('${name}') names no class`);
    }

    return { name: className, kind: 'class' };
  }

  if (name.startsWith(STYLE_PREFIX)) {
    const property = name.slice(STYLE_PREFIX.length);
    // A custom property is set as it is written, without unit
    if (property.startsWith('--')) {
      return { name: property, kind: 'style' };
    }

    const match = STYLE_PROPERTY_RE.exec(property);
    if (!match) {
      throw new Error(`@HostProperty('${name}') names no style property: write it in kebab-case or in camelCase, followed by its unit if any, e.g. 'style.width.px', or a custom property, e.g. 'style.--accent'`);
    }

    const binding: Omit<HostPropertyBinding, 'read'> = { name: match[1].replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), kind: 'style' };
    return match[2] ? Object.assign(binding, { unit: match[2] }) : binding;
  }

  if (!name) {
    throw new Error(`@HostProperty('${name}') names no attribute`);
  }

  return { name, kind: 'attribute' };
}
