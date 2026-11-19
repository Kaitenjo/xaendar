import type { Constructor, Dictionary } from '@xaendar/types';
import { INTERNAL_ALIAS_TO_ATTRIBUTE, INTERNAL_EVENTS, INTERNAL_REQUIRED_INPUTS,INTERNAL_HOST_DIRECTIVES, INTERNAL_HOST_LISTENERS, INTERNAL_HOST_ATTRIBUTES, INTERNAL_HYDRATE, INTERNAL_RENDER, INTERNAL_SELECTOR } from '../../costants';
import type { HydrateTrigger } from '../hydrate-trigger.type';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { HostListenerBinding } from '../host/host-listener-binding.type';
import { HostAttributeBinding } from '../host/host-attribute-binding.type';
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
   * The names of the properties of the inputs declared by `@Property.required`, which the code creating the component
   * or applying the directive must bind.
   */
  [INTERNAL_REQUIRED_INPUTS]?: Set<string>,
  /**
   * The names of the events the class dispatches: the ones of its `@Event`s and the events of change of its `@Model`s,
   * which a component can expose for its host directives without creating their outputs and models.
   */
  [INTERNAL_EVENTS]?: Set<string>,
  /**
   * The selector the component is registered with through `@WebComponent`.
   */
  [INTERNAL_SELECTOR]: string,
  /**
   * The attributes and the classes the class binds on its host element.
   */
  [INTERNAL_HOST_ATTRIBUTES]?: HostAttributeBinding[],
  /**
   * The events the class listens to on its host element.
   */
  [INTERNAL_HOST_LISTENERS]?: HostListenerBinding[],
  /**
   * The trigger hydrating the elements of the component rendered on the server, declared by `ssr.hydrate` of
   * `@WebComponent`.
   */
  [INTERNAL_HYDRATE]?: HydrateTrigger,
  /**
   * `false` when the component renders only in the browser, declared by `ssr.render` of `@WebComponent`.
   */
  [INTERNAL_RENDER]?: false
};
