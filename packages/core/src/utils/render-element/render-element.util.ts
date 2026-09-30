import type { Dictionary, NoArgsFunction, VoidFunction } from '@xaendar/types';
import { DIRECTIVE_CONNECT, MATHML_NS, SVG_NS } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { effect } from '../../signals/effect/effect';
import { isInputSignal } from '../../signals/input/input-instance.symbol';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import { InputSignal } from '../../signals/types/input-signal.type';
import { untracked } from '../../signals/untracked';
import type { RenderConditionalBinding, RenderElementConditionalBinding } from '../../types/render-conditional-binding.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import type { RenderElementEvent } from '../../types/render-element-event.type';
import { _Context, mountNode } from '../context/context.util';
import { _getDirective } from '../directive-registry/directive-registry.util';

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
 * @param conditionalBindings - List of conditional binding descriptors to apply to the element.
 * @param directives - List of directive descriptors to apply to the element, once all its own bindings are applied.
 * @returns The newly created HTML element.
 */
export function _renderElement(parentNode: Element, context: _Context, anchor: Comment | null, tagName: string, attributes: RenderElementAttribute[], events: RenderElementEvent[], conditionalBindings: RenderElementConditionalBinding[], directives: RenderElementDirective[]): Element {
  const element = context.createElement(tagName);
  mountNode(element, parentNode, context, anchor)
  bindAttributes(element, context, attributes);
  bindEvents(element, context, events);
  bindConditionalBindings(context, conditionalBindings, (branchContext, branch) => {
    bindAttributes(element, branchContext, branch.attributes);
    bindEvents(element, branchContext, branch.events);
    bindDirectives(element, branchContext, branch.directives);
  });
  bindDirectives(element, context, directives);
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
 * Binds a list of directive properties to a directive. A property declaring an `unbind`
 * is reset to its default value when the context is destroyed.
 * @param directive - The directive to bind the properties to.
 * @param context - The current template execution scope.
 * @param properties - The list of properties to bind to the directive.
 */
function bindDirectiveProperties(directive: CustomDirective, context: _Context, properties: RenderElementDirective['attributes']): void {
  for (let i = 0; i < properties.length; i++) {
    const { name, value, setter, unbind, defaultValue } = properties[i];
    setter(context, directive, name, value);
    unbind && context.listen(() => unbind(context, directive, name, () => defaultValue));
  }
}

/**
 * Binds a list of conditional bindings, creating a child context for each of them: `bind` applies
 * the bindings of the selected branch of a conditional binding in its child context, which is destroyed,
 * unbinding them, as soon as another branch, or none, is selected. The conditional bindings nested in a
 * branch are bound the same way while the branch is selected.
 *
 * Only the selection of the branch is tracked: a selection evaluated again without changing its outcome,
 * or a signal read while binding, never binds twice.
 * @param context - The current template execution scope.
 * @param conditionalBindings - The list of conditional bindings to bind.
 * @param bind - Applies the bindings of a branch, registering their cleanup in the given context.
 */
function bindConditionalBindings<Bindings extends { conditionalBindings: RenderConditionalBinding<Bindings>[] }>(context: _Context, conditionalBindings: RenderConditionalBinding<Bindings>[], bind: VoidFunction<[context: _Context, branch: Bindings]>): void {
  for (let i = 0; i < conditionalBindings.length; i++) {
    const branchContext = context.addChild();
    const conditionalBinding = conditionalBindings[i];
    let bound: Bindings | undefined;

    context.listen(effect(() => {
      const selected = selectBranch(conditionalBinding);
      if (selected === bound) {
        return;
      }

      bound = selected;
      untracked(() => {
        // The branch bound so far, if any, is unbound before the selected one is bound
        branchContext.unlisten();

        if (selected) {
          bind(branchContext, selected);
          bindConditionalBindings(branchContext, selected.conditionalBindings, bind);
        }
      });
    }));
  }
}

/**
 * Selects the branch of a conditional binding to apply: the first one, in declaration order, whose condition holds.
 * The condition of a `@switch` branch holds when one of its values is strictly equal to the value of the
 * expression, while a branch without condition (`@else`, `@default`) always holds.
 *
 * The conditions following the one of the selected branch are not evaluated, so the signals they read are not tracked.
 * @param conditionalBinding - The conditional binding to select the branch of.
 * @returns The selected branch, or `undefined` when no condition holds.
 */
function selectBranch<Bindings>(conditionalBinding: RenderConditionalBinding<Bindings>): Bindings | undefined {
  if (conditionalBinding.expression) {
    const value = conditionalBinding.expression();
    return conditionalBinding.branches.find(({ condition }) => !condition || condition.some(candidate => candidate === value));
  }

  return conditionalBinding.branches.find(({ condition }) => !condition || condition());
}

/**
 * Applies a list of directives to an HTML element: each directive is instantiated,
 * its properties are bound and its events listened to on the element, directly or
 * through its conditional bindings, then it is started.
 * The directive is disposed when the context is destroyed.
 * @param element - The element to apply the directives to.
 * @param context - The current template execution scope.
 * @param directives - The list of directives to apply to the element.
 * @throws When no directive is registered for a selector.
 */
function bindDirectives(element: Element, context: _Context, directives: RenderElementDirective[]): void {
  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes, events, conditionalBindings } = directives[i];
    const Directive = _getDirective(selector);
    if (!Directive) {
      throw new Error(`No directive registered for selector "${selector}"`);
    }

    // Elements rendered from a template are always HTML, SVG or MathML elements, all exposing the inline style of an HTMLElement
    const directive = new Directive(element as HTMLElement);
    bindDirectiveProperties(directive, context, attributes);
    bindEvents(element, context, events);
    bindConditionalBindings(context, conditionalBindings, (branchContext, branch) => {
      bindDirectiveProperties(directive, branchContext, branch.attributes);
      bindEvents(element, branchContext, branch.events);
    });

    directive[DIRECTIVE_CONNECT]();
    context.listen(() => directive[Symbol.dispose]());
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
 * @param target - The element to set the attribute on, or the directive to set the property on.
 * @param name - The name of the attribute.
 * @param value - The default value to set for the attribute.
 */
export function _setProperty(_context: _Context, target: Element | CustomDirective, name: string, value: string): void {
  updateProperty(target, name, value);
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
 * @param target - The element to set the attribute on, or the directive to set the property on.
 * @param name - The name of the attribute.
 * @param value - The default value to set for the attribute.
 */
export function _setExpressionProperty(_context: _Context, target: Element | CustomDirective, name: string, value: NoArgsFunction<unknown>): void {
  updateProperty(target, name, value());
}

/**
 * Sets a reactive attribute value on an HTML element.
 * A reactive expression is an expression containing at least one signal.
 * 
 * E.g., `<div id={ mySignal() }></div>`.
 *
 * @param _context - The current template execution scope.
 * @param target - The element to set the attribute on, or the directive to set the property on.
 * @param name - The name of the attribute.
 * @param value - A function that returns the attribute value.
 */
export function _setReactiveProperty(context: _Context, target: Element | CustomDirective, name: string, value: NoArgsFunction<unknown>): void {
  context.listen(effect(() => updateProperty(target, name, value())));
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
 * Updates a property on an HTML element or on a directive: when the property is an InputSignal its value is set,
 * otherwise the value is set as an attribute of the element.
 * @param target - The HTML element or the directive whose property is being updated.
 * @param name - The name, or the alias, of the property to update.
 * @param newValue - The new value to set for the property.
 * @throws When the target is a directive not declaring the property.
 */
function updateProperty(target: Element | CustomDirective, name: string, newValue: unknown): void {
  const componentOrDirective = target as unknown as Record<string, unknown> & { [name]: string | InputSignal };
  const constructor = target.constructor as unknown as Dictionary<string | symbol, Record<string, Dictionary<string>>>;
  name = constructor[Symbol.for('Symbol.metadata')]?.aliasToAttribute?.[name] ?? name;
  const property = componentOrDirective[name];
  
  if (property && isInputSignal(property)) {
    property.set(newValue, INPUT_SIGNAL_SET_SYMBOL);
  } else if (target instanceof CustomDirective) {
    target instanceof CustomDirective 
    throw new Error(`${target.constructor.name} does not declare a property named "${name}"`);
  } else {
    target.setAttribute(name, String(newValue));
  }
}