import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { HostDirectiveOptions } from './host-directive-options.type';

/**
 * Configuration object accepted by the `@WebComponent` decorator.
 */
export type WebComponentOptions = {
  /**
   * The custom element selector used to register the component in the browser.
   * A custom element name, as a class, can be defined only once: it must be unique across every component.
   */
  selector: string,
  /**
   * The custom directives applied to every instance of the component, on the component element itself. Each one is either the
   * class of the directive, or a {@link HostDirectiveOptions} also exposing its inputs and outputs on the component.
   * The instances are reached through `hostDirectives` of the component.
   */
  hostDirectives?: Array<Constructor<CustomDirective> | HostDirectiveOptions>,
  /**
   * Optional path to the component's stylesheet, relative to the component file.
   */
  styleUrl?: string,
  /**
   * Path to the component's HTML template, relative to the component file.
   */
  templateUrl: string
}
