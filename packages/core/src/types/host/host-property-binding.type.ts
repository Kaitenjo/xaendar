import type { EventHost } from '../event/event-host.type';

/**
 * An attribute or a class a web component or a custom directive binds on its host element, declared by `@HostProperty`.
 */
export type HostPropertyBinding = {
  /**
   * The name of the attribute, or of the class when {@link HostPropertyBinding.isClass} is `true`.
   */
  readonly name: string,
  /**
   * Whether the binding toggles a class (`class.name`) instead of writing an attribute.
   */
  readonly isClass: boolean,
  /**
   * Reads the decorated member of an instance: a field, a getter or an accessor.
   */
  readonly read: (owner: EventHost) => unknown
};
