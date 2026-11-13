import type { EventHost } from '../event/event-host.type';

/**
 * An attribute, a class or a style property a web component or a custom directive binds on its host element, declared
 * by `@HostProperty`.
 */
export type HostPropertyBinding = {
  /**
   * The name of the attribute, of the class, or of the style property, as CSS writes it.
   */
  readonly name: string,
  /**
   * What the binding writes: an attribute, a class it toggles (`class.name`), or a style property it sets
   * (`style.name`).
   */
  readonly kind: 'attribute' | 'class' | 'style',
  /**
   * The unit appended to the value of a style property, e.g. `px` in `style.width.px`, if any.
   */
  readonly unit?: string,
  /**
   * Reads the decorated member of an instance: a field, a getter or an accessor.
   */
  readonly read: (owner: EventHost) => unknown
};
