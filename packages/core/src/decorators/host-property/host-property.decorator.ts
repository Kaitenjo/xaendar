import { CSS_UNITS, toCssPropertyName } from '@xaendar/common';
import type { DecoratorMetadataContext } from '@xaendar/types';
import { INTERNAL_HOST_PROPERTIES } from '../../costants';
import type { EventHost } from '../../types/event/event-host.type';
import type { HostPropertyBinding } from '../../types/host/host-property-binding.type';
import type { HostPropertyDecorator } from '../../types/host/host-property-decorator.type';
import type { HostPropertyValue } from '../../types/host/host-property-value.type';
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
 * Decorator that binds an attribute, the classes or the style of the host element of a web component or of a custom
 * directive (the element it is applied to) to a field, a getter or an accessor. A structural directive cannot declare
 * it, since it holds no element.
 *
 * The member is read each time the element is connected, or the directive started, and again whenever a signal it reads
 * changes: a member that reads no signal is written once. A field holding a signal, or any other function, is called to
 * get the value. On an attribute, `null` and `undefined` remove it, a boolean adds it empty or removes it, but is
 * written as `"true"` or `"false"` on the `aria-*` and enumerated attributes, any other value is written as a string.
 *
 * `class` and `style` are merged key by key with the other sources writing them, as in a template: for each class or
 * property the template rendering the element wins over the directives, which win over the component, and in each level
 * a key bound alone wins over the string. A source without opinion on a key (`null`, `undefined`) leaves it to the ones
 * below. The forms:
 * - `class`: a string of classes (`'card wide'`);
 * - `class.name`: the class, present for a truthy value, absent for `false`, `0` and `''`;
 * - `style`: a string of declarations (`'display: flex; gap: 4px'`);
 * - `style.name`: the property, in kebab-case or in camelCase, or a custom property (`style.--accent`), set to a string
 *   or a number, followed by its unit, if any (`style.width.px`), with `!important` when the value ends with it.
 *
 * When the element is disconnected, or the directive destroyed, the attribute is removed, and the classes and the
 * properties of the owner are taken away, giving back the value of the sources below.
 *
 * The type of the member follows the name, a signal or a function returning it included: `string | null | undefined`
 * for `class` and `style`, `number | null | undefined` for a property with a unit, `string | number | null | undefined`
 * for a property without unit.
 *
 * @param name - The name of the attribute, `class`, `class.` followed by the name of the class, `style`, or `style.`
 *   followed by the name of the style property and its unit, if any.
 * @returns A decorator for a field, a getter or an accessor, not static.
 * @throws If the name is empty, `class.` is followed by no class, `style.` by no style property or by a unit CSS does not
 *   have, and, once applied, if the member is static or the class binds the same class or property twice.
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
 *
 * \@HostProperty('style')
 * public readonly layout = 'display: flex; gap: 4px';
 * ```
 */
export function HostProperty<const Name extends string>(name: Name): HostPropertyDecorator<HostPropertyValue<Name>> {
  const binding = toBinding(name);
  return (_value: unknown, context: DecoratorMetadataContext<ClassFieldDecoratorContext<EventHost> | ClassGetterDecoratorContext<EventHost> | ClassAccessorDecoratorContext<EventHost>, WebComponentMetadata>): void => {
    if (context.static) {
      throw new Error(`@HostProperty('${name}') cannot decorate the static member ${String(context.name)}`);
    }

    if (binding.kind !== 'attribute' && context.metadata[INTERNAL_HOST_PROPERTIES]?.some(({ kind, name: bound }) => kind === binding.kind && bound === binding.name)) {
      throw new Error(`@HostProperty('${name}') on ${String(context.name)} binds ${describe(binding)}, which another member binds already`);
    }

    _addHostMetadata(context.metadata, INTERNAL_HOST_PROPERTIES, Object.assign({ read: context.access.get }, binding));
  };
}

/**
 * Reads what the name given to `@HostProperty` binds: an attribute, the string or a class of `class`, the string or a
 * property of `style`.
 *
 * @param name - The name given to `@HostProperty`.
 * @returns The binding, without the member reading it.
 * @throws If the name is empty, `class.` is followed by no class, `style.` by no style property or by an unknown unit.
 */
function toBinding(name: string): Omit<HostPropertyBinding, 'read'> {
  switch (name) {
    case 'class':
    case 'style':
      return { name: '', kind: name };

    case '':
      throw new Error(`@HostProperty('${name}') names no attribute`);
  }

  if (name.startsWith(CLASS_PREFIX)) {
    const className = name.slice(CLASS_PREFIX.length);
    if (!className) {
      throw new Error(`@HostProperty('${name}') names no class`);
    }

    return { name: className, kind: 'class' };
  }

  if (name.startsWith(STYLE_PREFIX)) {
    return toStyleBinding(name, name.slice(STYLE_PREFIX.length));
  }

  return { name, kind: 'attribute' };
}

/**
 * Reads the style property, and its unit, a name given to `@HostProperty` binds.
 *
 * @param name - The name given to `@HostProperty`.
 * @param property - What follows `style.`.
 * @returns The binding, without the member reading it.
 * @throws If the property is not valid, or its unit is not one of CSS.
 */
function toStyleBinding(name: string, property: string): Omit<HostPropertyBinding, 'read'> {
  // A custom property is set as it is written, without unit
  if (property.startsWith('--')) {
    return { name: property, kind: 'style' };
  }

  const match = STYLE_PROPERTY_RE.exec(property);
  if (!match) {
    throw new Error(`@HostProperty('${name}') names no style property: write it in kebab-case or in camelCase, followed by its unit if any, e.g. 'style.width.px', or a custom property, e.g. 'style.--accent'`);
  }

  const [, written, unit] = match;
  if (unit && !CSS_UNITS.has(unit)) {
    throw new Error(`@HostProperty('${name}') sets ${written} in "${unit}", which is not a unit of CSS: write one of them, e.g. px, rem, %, vh`);
  }

  const binding: Omit<HostPropertyBinding, 'read'> = { name: toCssPropertyName(written), kind: 'style' };
  return unit ? Object.assign(binding, { unit }) : binding;
}

/**
 * Describes what a binding of `class` or `style` binds, for an error.
 *
 * @param binding - The binding.
 * @returns The description.
 */
function describe({ name, kind }: Omit<HostPropertyBinding, 'read'>): string {
  if (!name) {
    return `the string of ${kind}`;
  }

  return kind === 'class' ? `the class ${name}` : `the style property ${name}`;
}
