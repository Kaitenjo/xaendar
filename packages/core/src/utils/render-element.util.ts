import type { NoArgsFunction } from '@xaendar/types';
import { MATHML_NS, SVG_NS } from '../costants';
import { effect } from '../signals/effect/effect';
import type { RenderElementDynamicBinding } from '../types/render-dynamic-binding.type';
import type { RenderElementAttribute } from '../types/render-element-attribute.type';
import type { RenderElementEvent } from '../types/render-element-event.type';
import { Context, mountNode } from './context.util';

/**
 * Creates a DOM element, applies attributes and event listeners, appends it
 * to the parent, and registers cleanup functions in the current context.
 *
 * Static (literal) attribute values are set once via `setAttribute`. Dynamic
 * attribute values are wrapped in a reactive `effect` so they update
 * automatically whenever the underlying signal changes. Event listeners are
 * attached with `addEventListener` and the corresponding `removeEventListener`
 * is registered as a cleanup function.
 *
 * @param parentNode - The parent HTML element to append the new element to.
 * @param context - The current template execution scope.
 * @param tagName - The HTML tag name of the element to create.
 * @param attributes - List of attribute descriptors to apply to the element.
 * @param events - List of event listener descriptors to attach to the element.
 * @param dynamicBindings - List of dynamic binding descriptors to apply to the element.
 * @returns The newly created HTML element.
 */
export function _renderElement(parentNode: Element, context: Context, anchor: Comment | null, tagName: string, attributes: RenderElementAttribute[], events: RenderElementEvent[], dynamicBindings: RenderElementDynamicBinding[]): Element {
  const element = context.createElement(tagName);
  mountNode(element, parentNode, context, anchor)
  bindAttributes(element, context, attributes);
  bindEvents(element, context, events);
  bindDynamicBindings(element, context, dynamicBindings);
  return element;
}

/**
 * Creates an HTML element with the specified tag name.
 *
 * @param tagName - The HTML tag name of the element to create.
 * @returns The newly created HTML element.
 */
export function createElement(tagName: string): HTMLElement {
  return document.createElement(tagName);
}

/**
 * Creates an SVG element with the specified tag name using the SVG namespace.
 *
 * @param tagName - The SVG tag name of the element to create.
 * @returns The newly created SVG element.
 */
export function createSVGElement(tagName: string): SVGElement {
  return document.createElementNS(SVG_NS, tagName);
}

/**
 * Creates a MathML element with the specified tag name using the MathML namespace.
 *
 * @param tagName - The MathML tag name of the element to create.
 * @returns The newly created MathML element.
 */
export function createMATHMLElement(tagName: string): MathMLElement {
  return document.createElementNS(MATHML_NS, tagName);
}

/**
 * Sets a static attribute value on an HTML element.
 *
 * @param element - The element to set the attribute on.
 * @param name - The name of the attribute.
 * @param getter - A function that returns the attribute value.
 */
export function bindAttribute(element: Element, name: string, getter: NoArgsFunction<unknown>): void {
  element.setAttribute(name, String(getter()))
}

/**
 * Sets a reactive attribute value on an HTML element that updates automatically
 * whenever the underlying signal changes.
 *
 * @param context - The current template execution scope.
 * @param element - The element to set the attribute on.
 * @param name - The name of the attribute.
 * @param getter - A function that returns the attribute value.
 */
export function bindReactiveAttribute(context: Context, element: Element, name: string, getter: NoArgsFunction<unknown>): void {
  context.listen(effect(() => element.setAttribute(name, String(getter()))))
}

/**
 * Binds a list of attributes to an HTML element, using either static or reactive binding depending on the attribute's setter.
 * @param element - The element to bind the attributes to.
 * @param context - The current template execution scope.
 * @param attributes - The list of attributes to bind to the element.
 */
function bindAttributes(element: Element, context: Context, attributes: RenderElementAttribute[]): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, value, setter } = attributes[i];
    setter === bindAttribute ? setter(element, name, value) : setter(context, element, name, value)
  }
}

/**
 * Binds a list of event listeners to an HTML element.
 * @param element - The element to bind the events to.
 * @param context - The current template execution scope.
 * @param events - The list of events to bind to the element.
 */
function bindEvents(element: Element, context: Context, events: RenderElementEvent[]): void {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const handler = ($event: Event) => context.getEventHandler(event.handler)(...event.parameters.map(event => event($event)));
    const name = event.name;
    element.addEventListener(name, handler);
    context.listen(() => element.removeEventListener(name, handler))
  }
}

/**
 * Binds a list of dynamic bindings to an HTML element, creating child contexts for each binding and applying attributes, events, and nested dynamic bindings conditionally.
 * @param element - The element to bind the dynamic bindings to.
 * @param context - The current template execution scope.
 * @param dynamicBindings - The list of dynamic bindings to bind to the element.
 */
function bindDynamicBindings(element: Element, context: Context, dynamicBindings: RenderElementDynamicBinding[]): void {
  for (let i = 0; i < dynamicBindings.length; i++) {
    const dynamicBindingContext = context.addChild();
    const { condition, attributes, events, dynamicBindings: nestedDynamicBindings } = dynamicBindings[i];
    context.listen(effect(() => {
      if (condition()) {
        bindAttributes(element, dynamicBindingContext, attributes);
        bindEvents(element, dynamicBindingContext, events);
        bindDynamicBindings(element, dynamicBindingContext, nestedDynamicBindings);
      } else {
        dynamicBindingContext.unlisten();
      }
    }));
  }
}