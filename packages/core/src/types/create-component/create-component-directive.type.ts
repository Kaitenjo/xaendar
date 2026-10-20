import type { Constructor, NoArgsFunction } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { BindableEvents } from './bindable-events.type';
import type { BindableProperties } from './bindable-properties.type';
import type { BindingGroup } from './binding-group.type';

/**
 * A custom directive applied by `createComponent` to the component element: its class, or an object giving its class
 * along with the condition it is applied with and the bindings of its inputs and of its events.
 *
 * @template Directive - The custom directive to apply.
 */
export type CreateComponentDirective<Directive extends CustomDirective> = Constructor<Directive> | {
  /**
   * The class of the directive to apply.
   */
  directive: Constructor<Directive>,
  /**
   * The condition the directive is applied with: while it holds the directive is applied, as soon as it doesn't
   * the directive is destroyed, and a new instance is applied when it holds again. It runs in an effect, so it follows the signals it reads.
   */
  condition?: NoArgsFunction<boolean>,
  /**
   * The groups of inputs of the directive to bind.
   */
  properties?: BindingGroup<BindableProperties<NoInfer<Directive>>>[],
  /**
   * The groups of events of the directive to listen to, on the component element.
   */
  events?: BindingGroup<BindableEvents<NoInfer<Directive>>>[]
};
