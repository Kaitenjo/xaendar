import type { AbstractConstructor, Constructor, Dictionary, Function, NoArgsFunction, VoidFunction } from '@xaendar/types';
import { DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, MATHML_NS, SET_DIRECTIVE_ELEMENT, SVG_NS } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { StructuralDirective } from '../../models/structural-directive/structural-directive';
import { effect } from '../../signals/effect/effect';
import { isInputSignal } from '../../signals/input/input-instance.symbol';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import { signal } from '../../signals/signal/signal';
import { InputSignal } from '../../signals/types/input-signal.type';
import type { Signal as SignalType } from '../../signals/types/signal.type';
import { untracked } from '../../signals/untracked';
import type { BindingHost } from '../../types/binding-host.type';
import type { RenderConditionalBinding, RenderElementConditionalBinding, RenderElementStructuralDirectiveConditionalBinding } from '../../types/render-conditional-binding.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import type { RenderElementEvent } from '../../types/render-element-event.type';
import type { RenderElementStructuralDirective } from '../../types/render-element-structural-directive.type';
import { _Context, createAnchor, mountNode } from '../context/context.util';
import { _getDirective } from '../directive-registry/directive-registry.util';

/**
 * Renders the children of an element, as the compiler-generated render code does: it receives the element
 * and the context owning it, and returns the context it creates for the children.
 */
type RenderChildren = Function<[element: Element, parentContext: _Context], _Context>;

/**
 * Collects the flags of the structural directives applied to an element.
 */
type StructuralCollector = {
  /**
   * Registers the flag of a structural directive applied to the element.
   */
  add: VoidFunction<[flag: SignalType<boolean | undefined>]>,
  /**
   * Unregisters the flag of a structural directive no longer applied to the element.
   */
  remove: VoidFunction<[flag: SignalType<boolean | undefined>]>
};

/**
 * Creates a DOM element, applies attributes and event listeners, appends it
 * to the parent, renders its children and registers cleanup functions in the current context.
 *
 * Static (literal) attribute values are set once via `setAttribute`. Dynamic
 * attribute values are wrapped in a reactive `effect` so they update
 * automatically whenever the underlying signal changes. Event listeners are
 * attached with `addEventListener` and the corresponding `removeEventListener`
 * is registered as a cleanup function. The context the children are rendered in
 * is registered as a child of the one the element is rendered in, so it is destroyed along with it.
 *
 * When structural directives are applied, the element, along with its children, is rendered only while every one of them
 * allows it: the condition of the rendering is the AND of the outcomes of the structural directives currently applied, either
 * directly or through the selected branch of a conditional binding. While none is applied the element is rendered.
 *
 * Each structural directive evaluates {@link StructuralDirective.shouldRender} inside its own effect, writing the outcome
 * into its flag; an effect registered in the current context reads the flags and, when the AND changes, renders the element
 * in a child context or destroys it by clearing that context. The structural directives, and the conditional bindings
 * applying them, live in the current context, so they outlive the element they create and destroy.
 *
 * An asynchronous outcome is written once it settles: until then, the flag keeps its previous value, and a flag still
 * without any outcome neither renders nor destroys the element. The element is inserted before an anchor placed where
 * it belongs, so it keeps its position among its siblings however many times it is created again.
 *
 * @param parentNode - The parent HTML element to append the new element to.
 * @param context - The current template execution scope.
 * @param anchor - The node to insert the element before, or `null` to append it.
 * @param tagName - The HTML tag name of the element to create.
 * @param attributes - List of attribute descriptors to apply to the element.
 * @param events - List of event listener descriptors to attach to the element.
 * @param conditionalBindings - List of conditional binding descriptors to apply to the element.
 * @param directives - List of directive descriptors to apply to the element, once all its own bindings are applied.
 * @param structuralDirectives - List of structural directive descriptors deciding whether the element is rendered.
 * @param structuralConditionalBindings - List of conditional binding descriptors applying structural directives to the element.
 * @param children - Renders the children of the element, each time the element is created, or `null` when it has none.
 * @throws When no directive of the expected kind is registered for the selector of a directive.
 */
export function _renderElement(
  parentNode: Element,
  context: _Context,
  anchor: Comment | null,
  tagName: string,
  attributes: RenderElementAttribute[],
  events: RenderElementEvent[],
  conditionalBindings: RenderElementConditionalBinding[],
  directives: RenderElementDirective[],
  structuralDirectives: RenderElementStructuralDirective[],
  structuralConditionalBindings: RenderElementStructuralDirectiveConditionalBinding[],
  children: RenderChildren | null
): void {
  const render = (context: _Context, anchor: Comment | null) => renderElement(parentNode, context, anchor, tagName, attributes, events, conditionalBindings, directives, children);

  structuralDirectives.length || structuralConditionalBindings.length
   ? renderStructuralElement(parentNode, context, anchor, structuralDirectives, structuralConditionalBindings, render)
   : render(context, anchor);
}

/**
 * Creates a DOM element, applies its bindings and its directives, mounts it and renders its children, see {@link _renderElement}.
 *
 * @param parentNode - The parent HTML element to append the new element to.
 * @param context - The current template execution scope.
 * @param anchor - The node to insert the element before, or `null` to append it.
 * @param tagName - The HTML tag name of the element to create.
 * @param attributes - List of attribute descriptors to apply to the element.
 * @param events - List of event listener descriptors to attach to the element.
 * @param conditionalBindings - List of conditional binding descriptors to apply to the element.
 * @param directives - List of directive descriptors to apply to the element, once all its own bindings are applied.
 * @param children - Renders the children of the element, or `null` when it has none.
 * @throws When no custom directive is registered for the selector of a directive.
 */
function renderElement(parentNode: Element, context: _Context, anchor: Comment | null, tagName: string, attributes: RenderElementAttribute[], events: RenderElementEvent[], conditionalBindings: RenderElementConditionalBinding[], directives: RenderElementDirective[], children: RenderChildren | null): void {
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
  children && context.addChild(children(element, context));
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
    unbind && context.addUnlistener(() => unbind(context, element, name, () => defaultValue));
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
    context.addUnlistener(() => element.removeEventListener(name, handler));
  }
}

/**
 * Binds a list of directive properties to a directive. A property declaring an `unbind`
 * is reset to its default value when the context is destroyed.
 * @param directive - The directive to bind the properties to.
 * @param context - The current template execution scope.
 * @param properties - The list of properties to bind to the directive.
 */
function bindDirectiveProperties(directive: CustomDirective | StructuralDirective, context: _Context, properties: RenderElementDirective['attributes']): void {
  for (let i = 0; i < properties.length; i++) {
    const { name, value, setter, unbind, defaultValue } = properties[i];
    setter(context, directive, name, value);
    unbind && context.addUnlistener(() => unbind(context, directive, name, () => defaultValue));
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
    let current: Bindings | undefined;

    context.addUnlistener(effect(() => {
      const selected = selectBranch(conditionalBinding);
      untracked(() => {
        /*
          In rare cases when the signals registered in the expression changes but the final value
          of the expression is equal to the previous one we do not perform anything
        */
        if (selected === current) {
          return;
        }

        current = selected;
        branchContext.clear();

        /*
          Selected branch could be null if
          - No switch cases match the current value and it lacks a default value
          - No If/ElseIf match the condition and it lacks an else value  
        */
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
 * Expression and condition should be the reactive fields containing a callback with inside one or more signals registered
 * in the effect wrapping the call to this function.
 * 
 * If they are not signals, they will be called just once and never re-run again
 * 
 * The conditions following the one of the selected branch are not evaluated, so the signals they read are not tracked.
 * @param conditionalBinding - The conditional binding to select the branch of.
 * @returns The selected branch, or `undefined` when no condition holds.
 */
function selectBranch<Bindings extends { conditionalBindings: RenderConditionalBinding<Bindings>[] }>(conditionalBinding: RenderConditionalBinding<Bindings>): Bindings | undefined {
  /*
    Expression is defined = Switch Condiitonal Binding
  */
  if (conditionalBinding.expression) {
    const value = conditionalBinding.expression();
    return conditionalBinding.branches.find(({ condition }) => !condition || condition.some(candidate => candidate === value));
  }

  /*
    Otherwise If/ElseIf/Else Conditional Binding  
  */
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
 * @throws When no custom directive is registered for a selector.
 */
function bindDirectives(element: Element, context: _Context, directives: RenderElementDirective[]): void {
  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes, events, conditionalBindings } = directives[i];
    const Directive = resolveDirective(selector, CustomDirective);

    // Elements rendered from a template are always HTML, SVG or MathML elements, all exposing the inline style of an HTMLElement
    const directive = new Directive();
    directive[SET_DIRECTIVE_ELEMENT] = element;

    bindDirectiveProperties(directive, context, attributes);
    bindEvents(element, context, events);
    bindConditionalBindings(context, conditionalBindings, (branchContext, branch) => {
      bindDirectiveProperties(directive, branchContext, branch.attributes);
      bindEvents(element, branchContext, branch.events);
    });

    // Registered before connecting, so that `onDestroy` runs before the effects created in `onInit` are disposed
    context.addUnlistener(() => directive[DIRECTIVE_DISCONNECT]());
    directive[DIRECTIVE_CONNECT](context);
  }
}

/**
 * Renders an element only while every structural directive applied to it allows it, see {@link _renderElement}.
 *
 * Places an anchor where the element belongs and a child context the element is rendered in, then applies the
 * structural directives, either directly or through conditional bindings, collecting their flags. Finally registers
 * in the context the effect reading the flags: since it is created after the flags of the structural directives applied
 * from the start, the element is rendered, if it has to be, synchronously. Then, being an effect, it reacts once to all
 * the changes made at the same time, e.g. when a branch is selected in place of another, so the element is never
 * created or destroyed by an intermediate state.
 * @param parentNode - The parent HTML element the element is rendered into.
 * @param context - The current template execution scope, owning the structural directives.
 * @param anchor - The node to insert the element before, or `null` to append it.
 * @param structuralDirectives - The list of structural directives applied to the element.
 * @param structuralConditionalBindings - The list of conditional bindings applying structural directives to the element.
 * @param render - Renders the element, along with its children, in the given context and before the given anchor.
 * @throws When no structural directive is registered for a selector.
 */
function renderStructuralElement(
  parentNode: Element,
  context: _Context,
  anchor: Comment | null,
  structuralDirectives: RenderElementStructuralDirective[],
  structuralConditionalBindings: RenderElementStructuralDirectiveConditionalBinding[],
  render: VoidFunction<[context: _Context, anchor: Comment]>
): void {
  const elementAnchor = createAnchor('structural', parentNode, context, anchor);
  const elementContext = context.addChild();
  const flags = signal(new Array<SignalType<boolean | undefined>>());
  const collector: StructuralCollector = {
    add: flag => flags.update(list => [...list, flag]),
    remove: flagToRemove => flags.update(list => list.filter(flag => flag !== flagToRemove))
  };

  bindStructuralDirectives(context, structuralDirectives, collector);
  bindConditionalBindings(context, structuralConditionalBindings, (branchContext, branch) => bindStructuralDirectives(branchContext, branch.structuralDirectives, collector));

  let rendered = false;

  context.addUnlistener(effect(() => {
    const shouldRender = checkRender(flags);
    // Should render is undefined when one of the structural directives shouldRender effects is asynchronous and still running
    if (shouldRender === undefined || shouldRender === rendered) {
      return;
    }

    rendered = shouldRender;
    untracked(() => {
      elementContext.clear();
      shouldRender && render(elementContext, elementAnchor);
    });
  }));
}

/**
 * Resolves the rendering outcome of a set of structural directive flags: renders only when every flag reads `true`.
 * 
 * @param flags - Signal holding the list of per-directive flags registered by the applied structural directives.
 * @returns The first flag value, in order, that is `false` or `undefined` (the latter meaning an async directive is
 * still pending); `true` when every flag reads `true`.
 */
function checkRender(flags: SignalType<Array<SignalType<boolean | undefined>>>): boolean | undefined {
  const signalFlags = flags();

  for (let i = 0; i < signalFlags.length; i++) {
    const value = signalFlags[i]();
    switch (value) {
      case false:
      case undefined:
        return value;
    }
  }

  return true;
}

/**
 * Applies a list of structural directives: each directive is instantiated and its properties are bound, then its
 * `shouldRender` is evaluated inside an effect writing the outcome into the flag the directive registers in `flags`.
 * When the context is destroyed the effect is disposed and the flag unregistered.
 *
 * A synchronous outcome is written as soon as it is evaluated, an asynchronous one once it settles, unless the directive
 * was evaluated again, or the context destroyed, in the meantime: until then the flag keeps its previous value, which is
 * `undefined` before the first outcome. A rejected outcome leaves the flag as it is.
 * @param context - The current template execution scope.
 * @param structuralDirectives - The list of structural directives to apply.
 * @param collector - Collects the flags of the structural directives applied to the element.
 * @throws When no structural directive is registered for a selector.
 */
function bindStructuralDirectives(context: _Context, structuralDirectives: RenderElementStructuralDirective[], collector: StructuralCollector): void {
  for (let i = 0; i < structuralDirectives.length; i++) {
    const { selector, attributes } = structuralDirectives[i];
    const Directive = resolveDirective(selector, StructuralDirective);
    const directive = new Directive();
    const flag = signal<boolean | undefined>(undefined);
    let evaluation = 0;

    bindDirectiveProperties(directive, context, attributes);
    collector.add(flag);

    const dispose = effect(() => {
      const current = ++evaluation;
      const result = directive.shouldRender();
      typeof result === 'boolean'
        ? flag.set(result)
        : result.then(value => current === evaluation && flag.set(value));
    });

    context.addUnlistener(() => {
      evaluation++;
      dispose();
      collector.remove(flag);
    });
  }
}

/**
 * Retrieves the directive class registered for a selector, ensuring it is of the expected kind.
 * @param selector - The selector identifying the directive in templates.
 * @param kind - The base class the directive is expected to extend.
 * @returns The directive class registered for the selector.
 * @throws When no directive is registered for the selector, or when it does not extend `kind`.
 */
function resolveDirective<T extends CustomDirective | StructuralDirective>(selector: string, kind: AbstractConstructor<T>): Constructor<T> {
  const Directive = _getDirective(selector);
  if (!Directive) {
    throw new Error(`No directive registered for selector "${selector}"`);
  }

  const isDirectiveKind = (Directive: Constructor<CustomDirective | StructuralDirective>): Directive is Constructor<T> => Directive.prototype instanceof kind
  if (!isDirectiveKind(Directive)) {
    throw new Error(`Directive ${Directive.name} registered for selector "${selector}" is not a ${kind.name}`);
  }

  return Directive;
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
export function _setProperty(_context: _Context, target: Element | BindingHost, name: string, value: string): void {
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
export function _setExpressionProperty(_context: _Context, target: Element | BindingHost, name: string, value: NoArgsFunction<unknown>): void {
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
export function _setReactiveProperty(context: _Context, target: Element | BindingHost, name: string, value: NoArgsFunction<unknown>): void {
  context.addUnlistener(effect(() => updateProperty(target, name, value())));
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
function updateProperty(target: Element | BindingHost, name: string, newValue: unknown): void {
  const componentOrDirective = target as unknown as Record<string, unknown> & { [name]: string | InputSignal };
  const constructor = target.constructor as unknown as Dictionary<string | symbol, Record<string, Dictionary<string>>>;
  name = constructor[Symbol.for('Symbol.metadata')]?.aliasToAttribute?.[name] ?? name;
  const property = componentOrDirective[name];

  if (property && isInputSignal(property)) {
    property.set(newValue, INPUT_SIGNAL_SET_SYMBOL);
  } else if (target instanceof CustomDirective || target instanceof StructuralDirective) {
    throw new Error(`${target.constructor.name} does not declare a property named "${name}"`);
  } else {
    target.setAttribute(name, String(newValue));
  }
}