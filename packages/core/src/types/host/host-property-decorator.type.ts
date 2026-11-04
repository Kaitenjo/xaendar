import type { AccessorDecorator, FieldDecorator, GetterDecorator } from '@xaendar/types';
import type { EventHost } from '../event/event-host.type';
import type { WebComponentMetadata } from '../web-component/web-component-metadata.type';

/**
 * The decorator `@HostProperty` returns: it decorates a field, a getter or an accessor of a web component or of a custom
 * directive, not static, leaving it unchanged.
 */
export type HostPropertyDecorator = {
  /**
   * Decorates a field.
   */
  <This extends EventHost, Value>(...args: Parameters<FieldDecorator<This, Value, Value, WebComponentMetadata>>): void;
  /**
   * Decorates a getter.
   */
  <This extends EventHost, Value>(...args: Parameters<GetterDecorator<This, Value, WebComponentMetadata>>): void;
  /**
   * Decorates an accessor, such as one declared with `@Property`.
   */
  <This extends EventHost, Value>(...args: Parameters<AccessorDecorator<This, Value, WebComponentMetadata>>): void;
};
