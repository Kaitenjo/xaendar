import { keys } from '@xaendar/common';
import type { Constructor, NoArgsFunction } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { untracked } from '../../signals/untracked';
import { BindableEvents } from '../../types/create-component/bindable-events.type';
import { BindableProperties } from '../../types/create-component/bindable-properties.type';
import { BindingGroup } from '../../types/create-component/binding-group.type';
import type { ComponentRef } from '../../types/create-component/component-ref.type';
import type { CreateComponentOptions } from '../../types/create-component/create-component-options.type';
import type { RenderConditionalBinding } from '../../types/render-conditional-binding.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import { _Context } from '../context/context.util';
import { getSelector } from '../get-selector/get-selector.util';
import { _createElement, _renderElement, _resetProperty, _setReactiveProperty } from '../render-element/render-element.util';

/**
 * The bindings of the component element, or of a directive applied to it, collected from the groups of its inputs and of its events:
 * the bindings of an element and of a directive at once, so that they fit both.
 */
type Bindings = Pick<RenderElementDirective, 'attributes' | 'events'> & {
  /**
   * The groups bound only while their condition holds, each one an `@if` with a single branch.
   */
  conditionalBindings: RenderConditionalBinding<Bindings>[],
  /**
   * The directives applied as long as the component lives: always empty for a directive, which applies none.
   */
  directives: RenderElementDirective[]
};

/**
 * Creates a component and appends it to the target, binding its inputs and its events and applying directives to it, as a template
 * does for the tag of the component: the inputs are set before the element is mounted, so that its `onInit` reads them, the directives
 * are applied once it is.
 *
 * The value of an input is given by a getter, run in an effect: the input follows the signals the getter reads. A group of inputs or of
 * events with a `condition` is bound only while the condition holds, as an `@if` written in the tag: as soon as it doesn't, its inputs go
 * back to their default value and its events are no longer listened to. A directive with a `condition` is applied while the condition
 * holds, and a new instance of it each time the condition holds again.
 *
 * The component lives until `destroy` is called on the returned reference: the creation is not tracked by an effect it is called in.
 *
 * @example
 * ```ts
 * const toast = createComponent(ToastComponent, {
 *   target: document.body,
 *   properties: [{ message: () => this.message() }, { condition: () => this.urgent(), level: () => 'error' }],
 *   events: [{ closed: () => toast.destroy() }],
 *   directives: [TooltipDirective]
 * });
 * ```
 *
 * @param component - The class of the component, decorated with `@WebComponent`.
 * @param options - The target the component is appended to, the groups of its inputs and of its events, and the directives applied to it.
 * @returns The element of the component, along with the function destroying it.
 * @throws When the class is not decorated with `@WebComponent`, when an input is bound by more than one group, when a directive is not
 * a custom directive, or when it is already a host directive of the component.
 */
export function createComponent<
  Component extends CustomElement, 
  const Directives extends readonly CustomDirective[] = []
>(component: Constructor<Component>, options: CreateComponentOptions<NoInfer<Component>, Directives>): ComponentRef<Component> {
  const selector = getSelector(component);
  const bindings = collectBindings(options.properties, options.events);
  const entries = options.directives;

  if (entries?.length) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (typeof entry === 'function') {
        bindings.directives.push({ selector: entry, attributes: [], events: [], conditionalBindings: [] });
        continue;
      }

      const { attributes, events, conditionalBindings } = collectBindings(entry.properties, entry.events);
      const directive = { selector: entry.directive, attributes, events, conditionalBindings };
      entry.condition
        ? bindings.conditionalBindings.push({ branches: [{ condition: entry.condition, attributes: [], events: [], conditionalBindings: [], directives: [directive] }] })
        : bindings.directives.push(directive);
    }
  }

  // The root of the component's own bindings: it is never a scope of identifiers, only the owner of their cleanup
  const context = new _Context({ createElement: _createElement } as unknown as _Context);
  const { attributes, events, conditionalBindings, directives } = bindings;
  untracked(() => _renderElement(options.target, context, null, selector, attributes, events, conditionalBindings, directives, [], [], null));

  return {
    // The element is the first node tracked by the context, the only one rendered in it
    element: context.getNodes()[0] as Component,
    destroy: () => context.clear()
  };
}

/**
 * Collects the bindings of the component element, or of a directive, from the groups of its inputs and of its events: the bindings of a group
 * without a condition are applied as long as the component lives, the ones of a group with a condition become an `@if` with a single branch,
 * whose inputs go back to their default value once it is no longer selected.
 * @param properties - The groups of inputs, by name.
 * @param events - The groups of events, by name.
 * @returns The bindings collected.
 * @throws When an input is bound by more than one group.
 */
function collectBindings<Component extends CustomElement>(properties: BindingGroup<BindableProperties<NoInfer<Component>>>[] | undefined, events: BindingGroup<BindableEvents<NoInfer<Component>>>[] | undefined): Bindings {
  const bindings: Bindings = { attributes: [], events: [], conditionalBindings: [], directives: [] };
  // A group unbinding an input resets it to its default value, even if another group still binds it
  const bound = new Set<string>();

  if (properties?.length) {
    for (let i = 0; i < properties.length; i++) {
      const group = properties[i];
      const { attributes } = group.condition ? addBranch(bindings, group.condition) : bindings;
      const names = keys(group);
      for (let j = 0; j < names.length; j++) {
        const name = names[j];
        if (name === 'condition') {
          continue;
        }

        if (bound.has(name)) {
          throw new Error(`Property "${name}" is bound by more than one group`);
        }

        bound.add(name);
        const attribute: Bindings['attributes'][number] = { 
          name, 
          value: group[name], 
          setter: _setReactiveProperty as RenderElementAttribute['setter']
         };
        if (group.condition) {
          attribute.unbind = _resetProperty;
        }

        attributes.push(attribute);
      }
    }
  }

  if (events?.length) {
    for (let i = 0; i < events.length; i++) {
      const group = events[i];
      const { events: listeners } = group.condition ? addBranch(bindings, group.condition) : bindings;
      const names = keys(group);
      for (let j = 0; j < names.length; j++) {
        const name = names[j];
        if (name !== 'condition' && group[name]) {
          listeners.push({ 
            name, 
            handler: group[name] as typeof listeners[number]['handler']
          });
        }
      }
    }
  }

  return bindings;
}

/**
 * Adds to the bindings an `@if` with a single branch, holding the bindings applied while the condition holds.
 * @param bindings - The bindings to add the `@if` to.
 * @param condition - The condition the branch is selected with.
 * @returns The bindings of the branch, still empty.
 */
function addBranch(bindings: Bindings, condition: NoArgsFunction<boolean>): Pick<Bindings, 'attributes' | 'events'> {
  const branch: Bindings = { attributes: [], events: [], conditionalBindings: [], directives: [] };
  bindings.conditionalBindings.push({ branches: [Object.assign(branch, { condition })] });
  return branch;
}
