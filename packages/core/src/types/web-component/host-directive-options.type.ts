import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { HostDirectiveMember } from './host-directive-member.type';

/**
 * A custom directive applied to every instance of a web component, with the inputs and the outputs of the directive
 * the component exposes. The directive is applied to the component element itself.
 */
export type HostDirectiveOptions = {
  /**
   * The class of the directive to apply to the component element.
   */
  directive: Constructor<CustomDirective>,
  /**
   * The inputs of the directive exposed on the component, bindable from the templates using it: each one is the name
   * of an input of the directive (its alias, when it declares one), or an object also giving the name it is exposed with,
   * as in `'text'` or `{ name: 'text', alias: 'label' }`. The inputs not listed are reachable only through the instance of the directive.
   */
  properties?: HostDirectiveMember[],
  /**
   * The events of the directive exposed on the component, listened to from the templates using it: each one is the
   * name of an `@Event` of the directive, or an object also giving the name it is dispatched with on the component, as
   * in `'opened'` or `{ name: 'opened', alias: 'shown' }`. The events not listed are not dispatched on the component.
   */
  events?: HostDirectiveMember[]
};
