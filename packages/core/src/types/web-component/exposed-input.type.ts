import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';

/**
 * An input of a host directive a component exposes: the class of the directive and the name of the property of the
 * input, which the name it is exposed with leads to.
 */
export type ExposedInput = {
  /**
   * The class of the host directive declaring the input.
   */
  readonly directive: Constructor<CustomDirective>,
  /**
   * The name of the property of the input in the directive.
   */
  readonly property: string
};
