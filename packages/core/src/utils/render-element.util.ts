import type { Dictionary, NoArgsFunction } from '@xaendar/types';
import { MATHML_NS, SVG_NS } from '../costants';
import { BaseWebComponent } from '../directives';
import { InputSignal } from '../signals';
import { effect } from '../signals/effect/effect';
import { isInputSignal } from '../signals/input/input-instance.symbol';
import { INPUT_SIGNAL_SET_SYMBOL } from '../signals/input/input-set.symbol';
import type { RenderElementDynamicBinding } from '../types/render-dynamic-binding.type';
import type { RenderElementAttribute } from '../types/render-element-attribute.type';
import type { RenderElementEvent } from '../types/render-element-event.type';
import { _Context, mountNode } from './context.util';

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
export function _renderElement(parentNode: Element, context: _Context, anchor: Comment | null, tagName: string, attributes: RenderElementAttribute[], events: RenderElementEvent[], dynamicBindings: RenderElementDynamicBinding[]): Element {
  const element = context.createElement(tagName);
  mountNode(element, parentNode, context, anchor)
  bindAttributes(element, context, attributes);
  bindEvents(element, context, events);
  bindDynamicBindings(element, context, dynamicBindings);
  return element;
}

/**
 * Binds a list of attributes to an HTML element, using either static or reactive binding depending on the attribute's setter.
 * @param element - The element to bind the attributes to.
 * @param context - The current template execution scope.
 * @param attributes - The list of attributes to bind to the element.
 */
function bindAttributes(element: Element, context: _Context, attributes: RenderElementAttribute[]): void {
  for (let i = 0; i < attributes.length; i++) {
    const { name, value, setter, unbind, defaultValue } = attributes[i];
    setter(context, element, name, value);
    unbind && context.listen(() => unbind(context, element, name, () => defaultValue));
  }
}

/**
 * Binds a list of event listeners to an HTML element.
 * @param element - The element to bind the events to.
 * @param context - The current template execution scope.
 * @param events - The list of events to bind to the element.
 */
function bindEvents(element: Element, context: _Context, events: RenderElementEvent[]): void {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const handler = ($event: Event) => context.getEventHandler(event.handler)(...event.parameters.map(event => event($event)));
    const name = event.name;
    element.addEventListener(name, handler);
    context.listen(() => element.removeEventListener(name, handler));
  }
}

/**
 * Binds a list of dynamic bindings to an HTML element, creating child contexts for each binding and applying attributes, events, and nested dynamic bindings conditionally.
 * @param element - The element to bind the dynamic bindings to.
 * @param context - The current template execution scope.
 * @param dynamicBindings - The list of dynamic bindings to bind to the element.
 */
function bindDynamicBindings(element: Element, context: _Context, dynamicBindings: RenderElementDynamicBinding[]): void {
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

/**
 * Creates an HTML element with the specified tag name.
 *
 * @param tagName - The HTML tag name of the element to create.
 * @returns The newly created HTML element.
 */
export function _createElement(tagName: string): HTMLElement {
  return document.createElement(tagName);
}

/**
 * Creates an SVG element with the specified tag name using the SVG namespace.
 *
 * @param tagName - The SVG tag name of the element to create.
 * @returns The newly created SVG element.
 */
export function _createSVGElement(tagName: string): SVGElement {
  return document.createElementNS(SVG_NS, tagName);
}

/**
 * Creates a MathML element with the specified tag name using the MathML namespace.
*
* @param tagName - The MathML tag name of the element to create.
* @returns The newly created MathML element.
*/
export function _createMATHMLElement(tagName: string): MathMLElement {
  return document.createElementNS(MATHML_NS, tagName);
}

/**
 * Sets a literal attribute value on an HTML element.
 * E.g., `<div id="example"></div>`.
 *
 * @param _context - The current template execution scope.
 * @param element - The element to set the attribute on.
 * @param name - The name of the attribute.
 * @param value - The default value to set for the attribute.
 */
export function _setProperty(_context: _Context, element: Element, name: string, value: string): void {
  updateProperty(element, name, value);
}

/**
 * Sets a Literal expression attribute and a non-reactive binding on an HTML element.
 * A literal expression is an expression containing only one costant value
 * A non-reactive binding is an expression containing one non-signal value or one literal value and one non-reactive value or one combination of these.
 * 
 * E.g., `<div id={expression}></div>`.
 *       `<div id={ 'default' }></div>`.
 *       `<div maxlength="{ 1 }"></div>`.
 *       `<div maxlength="{ 1 + myVar}"></div>`.
 *       `<div maxlength="{ 1 + 3 }"></div>`.
 * 
 * @param _context - The current template execution scope.
 * @param element - The element to set the attribute on.
 * @param name - The name of the attribute.
 * @param value - The default value to set for the attribute.
 */
export function _setExpressionProperty(_context: _Context, element: Element, name: string, value: NoArgsFunction<unknown>): void {
  updateProperty(element, name, value());
}

/**
 * Sets a reactive attribute value on an HTML element.
 * A reactive expression is an expression containing at least one signal.
 * 
 * E.g., `<div id={ mySignal() }></div>`.
 *
 * @param _context - The current template execution scope.
 * @param element - The element to set the attribute on.
 * @param name - The name of the attribute.
 * @param value - A function that returns the attribute value.
 */
export function _setReactiveProperty(context: _Context, element: Element, name: string, value: NoArgsFunction<unknown>): void {
  context.listen(effect(() => updateProperty(element, name, value())));
}

/**
 * Removes an attribute from an HTML element.
 *
 * @param _context - The current template execution scope.
 * @param element - The element to remove the attribute from.
 * @param name - The name of the attribute to remove.
 */
export function _removeAttribute(_context: _Context, element: Element, name: string, _value?: unknown): void {
  element.removeAttribute(name);
}

/**
 * Updates a property on an HTML element, ensuring it is an InputSignal and setting its value.
 * @param element - The HTML element whose property is being updated.
 * @param name - The name of the property to update.
 * @param newValue - The new value to set for the property.
 */
function updateProperty(element: Element, name: string, newValue: unknown) {
  const component = element as BaseWebComponent & Record<string, unknown> & { [name]: InputSignal<unknown> };
  const constructor = component.constructor as unknown as Dictionary<string | symbol, Record<string, Dictionary<string>>>;
  name = constructor[Symbol.for('Symbol.metadata')]?.aliasToAttribute?.[name] ?? name;
  const property = component[name];
  property && isInputSignal(property) ? property.set(newValue, INPUT_SIGNAL_SET_SYMBOL) : component.setAttribute(name, String(newValue));
}