import type { NoArgsFunction } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import type { BindableEvents } from './bindable-events.type';
import type { BindableProperties } from './bindable-properties.type';
import type { BindingGroup } from './binding-group.type';
import type { CreateComponentDirective } from './create-component-directive.type';
import type { ExposableBindings } from './exposable-bindings.type';
import type { ExposedEventListener } from './exposed-event-listener.type';

/**
 * The options of `createComponent` of `CustomElement` and of `CustomDirective`: where the component is mounted, the bindings of its inputs and of its events, the directives applied to it and its content.
 *
 * @template Component - The component to create.
 * @template Directives - The custom directives applied to the component, one per item of `directives`.
 */
export type CreateComponentOptions<Component extends CustomDirective | CustomElement, Directives extends readonly CustomDirective[] = CustomDirective[]> = {
  /**
   * The element the component is appended to. In the options of `createComponent` of `CustomElement` and of `CustomDirective` it can be left out:
   * the component is then appended to the host element, that is the element of the component or the element the directive is applied to.
   */
  target: Element,
  /**
   * The groups of inputs of the component to bind: a group without `condition` is bound as long as the component lives,
   * a group with `condition` only while the condition holds, its inputs going back to their default value as soon as it doesn't.
   * The inputs the host directives of the component expose are bound by the name they are exposed with: the names the class
   * declares are typed and suggested, any other one is accepted with a getter of any value (see `ExposableBindings`).
   */
  properties?: BindingGroup<ExposableBindings<BindableProperties<Component>, NoArgsFunction<unknown>>>[],
  /**
   * The groups of events to listen to on the component: a group without `condition` is listened to as long as the component lives,
   * a group with `condition` only while the condition holds. The events the host directives of the component expose are
   * listened to by the name they are exposed with: the names the class declares and the native ones are typed and
   * suggested, any other one is accepted with a listener taking an `Event` (see `ExposedEventListener`).
   */
  events?: BindingGroup<ExposableBindings<BindableEvents<Component>, ExposedEventListener>>[],
  /**
   * The custom directives to apply to the component, once it is mounted.
   */
  directives?: { [Index in keyof Directives]: CreateComponentDirective<Directives[Index]> },
  /**
   * The nodes to append to the component, as its children, once it is mounted and its directives are applied: the content
   * its template projects into its slots, a named one through the `slot` attribute of the node. A `DocumentFragment` is
   * appended as its nodes. They are not removed when the component is destroyed: they stay in its element.
   */
  content?: Node[]
};