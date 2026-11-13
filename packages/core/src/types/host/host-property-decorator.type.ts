import type { AccessorDecorator, FieldDecorator, GetterDecorator } from '@xaendar/types';
import type { EventHost } from '../event/event-host.type';
import type { WebComponentMetadata } from '../web-component/web-component-metadata.type';

/**
 * The decorator `@HostProperty` returns: it decorates a field, a getter or an accessor of a web component or of a custom
 * directive, not static, leaving it unchanged. The member gives a value of the type the name allows (see
 * `HostPropertyValue`), or a function returning it, such as a signal.
 *
 * @template Allowed - The values the name allows.
 */
export type HostPropertyDecorator<Allowed = unknown> = {
  /**
   * Decorates a field.
   */
  <This extends EventHost, Value extends Allowed | (() => Allowed)>(...args: Parameters<FieldDecorator<This, Value, Value, WebComponentMetadata>>): void;
  /**
   * Decorates a getter.
   */
  <This extends EventHost, Value extends Allowed | (() => Allowed)>(...args: Parameters<GetterDecorator<This, Value, WebComponentMetadata>>): void;
  /**
   * Decorates an accessor, such as one declared with `@Property`.
   */
  <This extends EventHost, Value extends Allowed | (() => Allowed)>(...args: Parameters<AccessorDecorator<This, Value, WebComponentMetadata>>): void;
};
