import type { Constructor, Dictionary } from '@xaendar/types';
import { INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_HOST_DIRECTIVES, INTERNAL_HOST_EVENTS, INTERNAL_HOST_PROPERTIES, INTERNAL_SELECTOR } from '../../costants';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import { HostEventListener } from '../host/host-event-listener.type';
import { HostPropertyBinding } from '../host/host-property-binding.type';
import type { HostDirectiveOptions } from './host-directive-options.type';

/**
 * The metadata a Web Component Class stores through its decorators, as the ones of the host directives of a component and
 * the ones of the inputs of a class.
 */
export type WebComponentMetadata = {
  /**
   * The host directives the component declares through `hostDirectives` of `@WebComponent`.
   */
  [INTERNAL_HOST_DIRECTIVES]?: Array<Constructor<CustomDirective> | HostDirectiveOptions>,
  /**
   * The inputs declared by `@Property`, as a map from the name each is bound with, its alias when it has one, to the
   * name of its accessor.
   */
  [INTERNAL_ALIAS_TO_ATTRIBUTE]?: Dictionary<string, string>,
  /**
   * The selector the component is registered with through `@WebComponent`.
   */
  [INTERNAL_SELECTOR]: string,
  /**
   * The attributes and the classes the class binds on its host element.
   */
  [INTERNAL_HOST_PROPERTIES]?: HostPropertyBinding[],
  /**
   * The events the class listens to on its host element.
   */
  [INTERNAL_HOST_EVENTS]?: HostEventListener[]
};
