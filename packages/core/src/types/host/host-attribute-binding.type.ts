import type { EventHost } from '../event/event-host.type';

/**
 * An attribute, the classes, the style or the parts a web component or a custom directive binds on its host element,
 * declared by `@HostAttribute`.
 */
export type HostAttributeBinding = {
  /**
   * The name of the attribute, of the class, of the style property, as CSS writes it, or of the part: empty for the
   * string of `class`, of `style` or of `part` (`@HostAttribute('class')`).
   */
  readonly name: string,
  /**
   * What the binding writes: an attribute, the classes (`class`, `class.name`), the style (`style`, `style.name`), or
   * the parts (`part`, `part.name`).
   */
  readonly kind: 'attribute' | 'class' | 'style' | 'part',
  /**
   * The unit appended to the value of a style property, e.g. `px` in `style.width.px`, if any.
   */
  readonly unit?: string,
  /**
   * Reads the decorated member of an instance: a field, a getter or an accessor.
   */
  readonly read: (owner: EventHost) => unknown
};
