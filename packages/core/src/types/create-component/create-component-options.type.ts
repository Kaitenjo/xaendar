import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { BindableEvents } from './bindable-events.type';
import type { BindableProperties } from './bindable-properties.type';
import type { BindingGroup } from './binding-group.type';
import type { CreateComponentDirective } from './create-component-directive.type';

/**
 * The options of `createComponent` of `CustomElement` and of `CustomDirective`: where the component is mounted, the bindings of its inputs and of its events, the directives applied to it and its content.
 *
 * @template Component - The component to create.
 * @template Directives - The custom directives applied to the component, one per item of `directives`.
 */
export type CreateComponentOptions<Component, Directives extends readonly CustomDirective[] = CustomDirective[]> = {
  /**
   * The element the component is appended to.
   */
  target: Element,
  /**
   * The groups of inputs of the component to bind: a group without `condition` is bound as long as the component lives,
   * a group with `condition` only while the condition holds, its inputs going back to their default value as soon as it doesn't.
   */
  properties?: BindingGroup<BindableProperties<Component>>[],
  /**
   * The groups of events to listen to on the component: a group without `condition` is listened to as long as the component lives,
   * a group with `condition` only while the condition holds.
   */
  events?: BindingGroup<BindableEvents<Component>>[],
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
