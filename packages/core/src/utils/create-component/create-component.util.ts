import { keys } from '@xaendar/common';
import type { Constructor, Function, NoArgsFunction } from '@xaendar/types';
import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import { untracked } from '../../signals/untracked';
import { BindableEvents } from '../../types/create-component/bindable-events.type';
import { BindableProperties } from '../../types/create-component/bindable-properties.type';
import { BindingGroup } from '../../types/create-component/binding-group.type';
import type { ComponentRef } from '../../types/create-component/component-ref.type';
import type { CreateComponentOptions } from '../../types/create-component/create-component-options.type';
import { HEADER } from '../../costants';
import type { _Context } from '../../types/context.type';
import { _scope, addChild, clear, ELEMENT_LAYOUT, removeChild } from '../context/context.util';
import { getSelector } from '../get-selector/get-selector.util';
import { _assertRequiredInputs } from '../required-inputs/required-inputs.util';
import { _toPropertyName } from '../input-names/input-names.util';
import { _renderElement, _resetProperty, _setReactiveInput } from '../render-element/render-element.util';
import type { Bindings } from '../../types/create-component/bindings.type';
import type { TemplateHandler } from '../../types/template-handler.type';

/**
 * What binds the inputs of a component `createComponent` creates, for the error of a required input left out.
 */
const REQUIRED_INPUTS_BINDER = 'a group without condition of createComponent';

/**
 * Creates a component and appends it to the target, binding its inputs and its events, applying directives to it and appending the
 * content to it, as a template does for the tag of the component: the inputs are set before the element is mounted, so that its `onInit`
 * reads them, the directives are applied and the content appended once it is. Implements `createComponent` of `CustomElement` and of
 * `CustomDirective`.
 *
 * The context of the component is a child of the context of its owner, so it is cleared along with it; `destroy` clears it earlier,
 * removing it from the context the owner has at that moment, which is not the one it had at the creation when the owner was not
 * connected yet. The creation is not tracked by an effect it is called in.
 *
 * @param owner - Returns the current context of the component or of the directive creating the component.
 * @param component - The class of the component, decorated with `@WebComponent`.
 * @param options - The target the component is appended to, the groups of its inputs and of its events, the directives applied to it and its content.
 * @returns The element of the component, along with the function destroying it.
 * @throws When the class is not decorated with `@WebComponent`, when an input is bound by more than one group, when a required input
 * of the component or of a directive is not bound by a group without condition, when a directive is not a custom directive, or when it
 * is already a host directive of the component.
 */
export function _createComponent<
  Component extends CustomElement, 
  Directives extends readonly CustomDirective[]
>(owner: NoArgsFunction<_Context>, component: Constructor<Component>, options: CreateComponentOptions<Component, Directives>): ComponentRef<Component> {
  const selector = getSelector(component);
  const bindings = collectBindings(component, options.properties, options.events);
  const entries = options.directives;

  if (entries?.length) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (typeof entry === 'function') {
        _assertRequiredInputs(entry, undefined, REQUIRED_INPUTS_BINDER);
        bindings.directives.push({ selector: entry });
        continue;
      }

      const { attributes, events, conditionalBindings } = collectBindings(entry.directive, entry.properties, entry.events);
      const directive = { 
        selector: entry.directive, 
        attributes, 
        events, 
        conditionalBindings 
      };
      
      entry.condition
        ? bindings.conditionalBindings.push({ branches: [{ condition: entry.condition, attributes: [], events: [], conditionalBindings: [], directives: [directive] }] })
        : bindings.directives.push(directive);
    }
  }

  // The root of the component's own bindings: it is never a scope of identifiers, only the owner of their cleanup
  const context = _scope(null, ELEMENT_LAYOUT);
  // Registered before the render, so that what a render failing halfway leaves is cleared along with the owner
  addChild(owner(), context);
  const { attributes, events, conditionalBindings, directives } = bindings;
  const element = untracked(() => {
    _renderElement(options.target, context, null, { tagName: selector, attributes, events, conditionalBindings, directives, slot: HEADER });
    // The element is the first node tracked by the context, the only one rendered in it
    const element = context[HEADER] as Component;
    // Appended once the directives are applied, as a template renders the children of a tag: they are not tracked, so they stay in the element
    if (options.content?.length) {
      element.append(...options.content);
    }

    return element;
  });

  return {
    element,
    destroy: () => {
      removeChild(owner(), context);
      clear(context);
    }
  };
}

/**
 * Collects the bindings of the component element, or of a directive, from the groups of its inputs and of its events: the bindings of a group
 * without a condition are applied as long as the component lives, the ones of a group with a condition become an `@if` with a single branch,
 * whose inputs go back to their default value once it is no longer selected.
 * @param target - The class of the component or of the directive, whose required inputs must be bound by a group without condition.
 * @param properties - The groups of inputs, by the name they are bound with: their alias, when they declare one.
 * @param events - The groups of events, by name.
 * @returns The bindings collected.
 * @throws When an input is bound by more than one group, or by the name of its property while it declares an alias, or a required input
 * is not bound by a group without condition.
 */
function collectBindings<Target extends CustomElement | CustomDirective>(target: { name: string }, properties: BindingGroup<BindableProperties<Target>>[] | undefined, events: BindingGroup<BindableEvents<Target>>[] | undefined): Bindings {
  const bindings: Bindings = { attributes: [], events: [], conditionalBindings: [], directives: [] };
  // A group unbinding an input resets it to its default value, even if another group still binds it
  const bound = new Set<string>();
  // The inputs bound as long as the component lives, the only ones a required input can be bound by
  const alwaysBound = new Set<string>();

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

        // Bound by its alias, set by the name of its property
        const property = _toPropertyName(target, name);
        if (bound.has(property)) {
          throw new Error(`Property "${name}" is bound by more than one group`);
        }

        bound.add(property);
        const attribute: Bindings['attributes'][number] = {
          name: property,
          value: group[name],
          setter: _setReactiveInput
        };

        group.condition ? attribute.unbind = _resetProperty : alwaysBound.add(property);

        attributes.push(attribute);
      }
    }
  }

  _assertRequiredInputs(target, alwaysBound, REQUIRED_INPUTS_BINDER);

  if (events?.length) {
    for (let i = 0; i < events.length; i++) {
      const group = events[i];
      const { events: listeners } = group.condition ? addBranch(bindings, group.condition) : bindings;
      const names = keys(group);
      for (let j = 0; j < names.length; j++) {
        const name = names[j];
        if (name !== 'condition' && typeof name === 'string' && group[name]) {
          listeners.push({ name, handler: toTemplateHandler(group[name] as Function<[event: Event], unknown>) });
        }
      }
    }
  }

  return bindings;
}

/**
 * Adapts a listener given to `createComponent`, which receives the event, to the handler of a template, which receives
 * the context first (see `TemplateHandler`): the listener is called with the element as `this`, as `addEventListener`
 * calls it.
 *
 * @param listener - The listener.
 * @returns The handler.
 */
function toTemplateHandler(listener: Function<[event: Event], unknown>): TemplateHandler {
  return (_context, event) => listener.call(event.currentTarget, event);
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
