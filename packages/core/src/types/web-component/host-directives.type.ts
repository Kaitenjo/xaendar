import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';

/**
 * The host directives of a web component, keyed by the class of the directive: the instances are reached by
 * their class, typed accordingly, from the component and from its template.
 *
 * @example
 * ```ts
 * this.hostDirectives.get(TooltipDirective)?.text();
 * ```
 */
export type HostDirectives = Omit<ReadonlyMap<Constructor<CustomDirective>, CustomDirective>, 'get'> & {
  /**
   * Gets the instance of a host directive.
   *
   * @param directive - The class of the directive.
   * @returns The instance of the directive applied to the component, or `undefined` when it is not one of its host directives.
   */
  get<Directive extends CustomDirective>(directive: Constructor<Directive>): Directive | undefined
};
