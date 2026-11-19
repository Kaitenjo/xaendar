import type { Constructor } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import type { ComponentRef } from '../../types/create-component/component-ref.type';
import type { CreateComponentOptions } from '../../types/create-component/create-component-options.type';
import { _getComponentRuntime } from '../component-runtime/component-runtime.util';

/**
 * Creates a component outside of any component or directive and appends it to the target, binding its inputs and its
 * events, applying directives to it and appending the content to it, as a template does for the tag of the component:
 * the inputs are set before the element is mounted, so that its `onInit` reads them, the directives are applied and the
 * content appended once it is. It mounts the root of an application, or a component from code that is not a component
 * (a service, a plain module).
 *
 * The value of an input is given by a getter, run in an effect: the input follows the signals the getter reads. A group of
 * inputs or of events with a `condition` is bound only while the condition holds, as an `@if` written in the tag: as soon
 * as it doesn't, its inputs go back to their default value and its events are no longer listened to. A directive with a
 * `condition` is applied while the condition holds, and a new instance of it each time the condition holds again.
 *
 * The component belongs to nothing: it lives until `destroy` of the returned reference, which removes it and disposes its
 * bindings. Removing its element with the DOM APIs destroys the component, but not the effects binding its inputs: call
 * `destroy`. Inside a component or a directive, use their `createComponent` instead, which destroys the component along
 * with them. On the server, as the methods do, it constructs the component without rendering it. The creation is not
 * tracked by an effect it is called in.
 *
 * @example
 * ```ts
 * const app = createComponent(AppComponent, {
 *   target: document.body,
 *   properties: [{ user: () => session.user() }],
 *   events: [{ signedOut: () => app.destroy() }]
 * });
 * ```
 *
 * @param component - The class of the component, decorated with `@WebComponent`.
 * @param options - The target the component is appended to, the groups of its inputs and of its events, the directives
 *   applied to it and its content.
 * @returns The element of the component, along with the function destroying it.
 * @throws When the class is not decorated with `@WebComponent`, when an input is bound by more than one group, when a
 *   name is not an input of the component nor one its host directives expose, when a required input of the component or
 *   of a directive is not bound by a group without condition, when a directive is not a custom directive, or when it is
 *   already a host directive of the component.
 */
export function createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<Component, Directives>): ComponentRef<Component> {
  return _getComponentRuntime().createComponent(null, component, options);
}
