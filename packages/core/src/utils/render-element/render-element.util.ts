import { _SSR_MARKERS, COMPONENT, DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, HEADER, SET_DIRECTIVE_ELEMENT } from '../../costants';
import { AttributeUnbinding } from '../../models/attribute-unbinding/attribute-unbinding';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import { StructuralDirective } from '../../models/structural-directive/structural-directive';
import { TemplateListener } from '../../models/template-listener/template-listener';
import { _bindSite, effect } from '../../signals/effect/effect';
import { isInputSignal } from '../../signals/input/input-instance.symbol';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import { signal } from '../../signals/signal/signal';
import type { SettableInputSignal } from '../../signals/types/settable-input-signal.type';
import type { Signal as SignalType } from '../../signals/types/signal.type';
import { untracked } from '../../signals/untracked';
import type { BindingHost } from '../../types/binding-host.type';
import type { ConditionalBindingRun } from '../../types/conditional-binding-run.type';
import type { ElementBinding } from '../../types/element-binding.type';
import type { NodeStrategy } from '../../types/node-strategy.type';
import type { RenderChildren } from '../../types/render-children.type';
import type { RenderConditionalBinding } from '../../types/render-conditional-binding.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { RenderElementConditionalBinding } from '../../types/render-element-conditional-binding.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import type { RenderElementEvent } from '../../types/render-element-event.type';
import type { RenderElementStructuralDirectiveConditionalBinding } from '../../types/render-element-structural-directive-conditional-binding.type';
import type { RenderElementStructuralDirective } from '../../types/render-element-structural-directive.type';
import type { RenderElement } from '../../types/render-element.type';
import type { StructuralCollector } from '../../types/structural-collector.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import { _addAppliedDirective, _removeAppliedDirective } from '../applied-directives/applied-directives.util';
import { restoreBindings } from '../class-toggle/class-toggle.util';
import type { _Context } from '../../types/context.type';
import { _scope, addCleanup, clear, containerSlot, EMPTY_LAYOUT, getNodeStrategy, STRUCTURAL_LAYOUT, swapNodeStrategy, trackNode } from '../context/context.util';
import { _setElementRef } from '../element-refs/element-refs.util';
import { _resolveDirective } from '../resolve-directive/resolve-directive.util';
import { _selectBranch } from '../select-branch/select-branch.util';
import { connectChild } from '../try-scope/try-scope.util';
import { _setContentTemplates } from '../content-templates/content-templates.util';
import { writeAttribute } from '../write-attribute/write-attribute.util';

/**
 * Creates a DOM element, applies attributes and event listeners, appends it
 * to the parent, renders its children and registers cleanup functions in the current context.
 *
 * The element is described by a constant of the module of the template (see `RenderElement`), shared by every element
 * it describes: static (literal) attribute values are set once via `setAttribute`, dynamic ones are bindings, functions
 * of the module the runtime calls with the component and the context (see `_bindSite`), which update the attribute
 * whenever a signal or a variable of the template they read changes. Event listeners are attached as objects calling
 * the handler of the template (see `TemplateListener`), removed when the context is cleared. The children are rendered
 * in the context the element is rendered in, or in a child of it when they need one (see `renderElementChildren`), so
 * they are destroyed along with it.
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
 * @param element - The element to render, a constant of the module of the template.
 * @throws When no directive of the expected kind is registered for the selector of a directive, and, in the content of a
 *   `@try`, the error of the component the element is.
 */
export function _renderElement(parentNode: Element, context: _Context, anchor: Comment | null, element: RenderElement): void {
  element.structuralDirectives?.length || element.structuralConditionalBindings?.length
    ? renderStructuralElement(parentNode, context, anchor, element)
    : renderElement(parentNode, context, anchor, element);
}

/**
 * Creates a DOM element, applies its bindings and its directives, mounts it and renders its children, see {@link _renderElement}.
 *
 * @param parentNode - The parent HTML element to append the new element to.
 * @param context - The current template execution scope.
 * @param anchor - The node to insert the element before, or `null` to append it.
 * @param config - The element to render.
 * @throws When no custom directive is registered for the selector of a directive, and, in the content of a `@try`, the
 *   error of the component the element is.
 */
function renderElement(parentNode: Element, context: _Context, anchor: Comment | null, config: RenderElement, slot = config.slot): void {
  const { attributes, events, conditionalBindings, directives, children, ref } = config;
  const nodeStrategy = getNodeStrategy(context);
  const element = nodeStrategy.element(context, parentNode, config.tagName, config.namespace);
  if (ref) {
    context[config.refSlot!] = element;
    _setElementRef(element, ref);
  }

  trackNode(element, parentNode, context, slot);
  // A standard <template> the server wrote already holds its content: the parser of the browser put it there
  if (config.content && !(element as HTMLTemplateElement).content.firstChild) {
    element.innerHTML = config.content;
  }

  if (attributes?.length) {
    bindProperties(element, context, attributes);
  }

  if (events?.length) {
    bindEvents(element, context, events);
  }

  // Passed like the inputs, before the component is connected: its first render reads them
  if (config.templates) {
    _setContentTemplates(element, context, config.templates);
  }

  // The directives of the branches selected before the element is mounted are applied once it is
  let binding: ElementBinding | undefined;
  if (conditionalBindings?.length) {
    binding = { element, mounted: false, pending: null };
    bindConditionalBindings(context, conditionalBindings, binding, bindElementBranch);
  }

  /*
    Element is inserted in the DOM after the bindings because it triggers:
    connected callback -> onInit -> registered effects that could read
    inputs values. Adding the element before the binding would throw exception
    in some cases because inputs have their default value
    Ex: reading .field when an input is still undefined
    An element adopted from the HTML of the server is already in the DOM: mounting it starts the hydration of the
    component it is, at the same point. Inside a @try, the error of the component is thrown here
  */
  connectChild(nodeStrategy, element, parentNode, anchor);
  if (binding) {
    applyPendingDirectives(binding);
  }

  if (directives?.length) {
    bindDirectives(element, context, directives);
  }

  if (children) {
    renderElementChildren(element, context, nodeStrategy, children);
  }
}

/**
 * Marks an element as mounted, then applies the directives of the branches of its conditional bindings selected before:
 * a branch selected from then on applies its directives at once.
 *
 * @param binding - The element.
 * @throws When no custom directive is registered for the selector of a directive.
 */
function applyPendingDirectives(binding: ElementBinding): void {
  binding.mounted = true;
  const { pending } = binding;
  if (pending?.length) {
    binding.pending = null;
    for (let i = 0; i < pending.length; i++) {
      const [context, directives] = pending[i];
      bindDirectives(binding.element, context, directives);
    }
  }
}

/**
 * Renders the children of an element in the context the element is rendered in: in a hydration, the children of an
 * element created in place of a node of the server not matching it are created too, the context getting their strategy
 * while they render. The context the children create for themselves, if any, the content of an element structural
 * directives are applied to, is held by the container of the scope of that element (see `STRUCTURAL_LAYOUT`).
 *
 * N.B. Deliberate, to save memory: the children are rendered in the context of the element, instead of one per element,
 * which a large table pays per cell, its strategy swapped while they render when theirs differs, instead of a context
 * of their own, which the compiler would have to count as a scope of the chain the children read their variables
 * through. Their effects and listeners are cleared with the context of the element, which removes the element and so
 * its children too. Do not create a context for them.
 *
 * @param element - The element.
 * @param context - The context the element is rendered in.
 * @param nodeStrategy - The strategy the element was got with.
 * @param children - Renders the children.
 * @throws The error of the render of the children.
 */
function renderElementChildren(element: Element, context: _Context, nodeStrategy: NodeStrategy, children: RenderChildren): void {
  const childrenStrategy = nodeStrategy.children(element);
  let ownContext: _Context | undefined;
  if (childrenStrategy === nodeStrategy) {
    ownContext = children(element, context);
  } else {
    swapNodeStrategy(context, childrenStrategy);
    try {
      ownContext = children(element, context);
    } finally {
      swapNodeStrategy(context, nodeStrategy);
    }
  }

  // Only the content of an element structural directives are applied to creates one, held by the scope of the element
  if (ownContext) {
    context[containerSlot(context)] = ownContext;
  }
}

/**
 * Binds a list of attributes to an HTML element, or a list of properties to a directive, each one through its setter.
 * When some of them declare an `unbind`, as the ones of a branch of a conditional binding, a single cleanup unbinds them
 * once the context is cleared (see `AttributeUnbinding`).
 *
 * @param target - The element, or the directive, to bind the attributes to.
 * @param context - The current template execution scope.
 * @param attributes - The list of attributes to bind, constants of the module of the template.
 */
function bindProperties(target: Element | BindingHost, context: _Context, attributes: readonly RenderElementAttribute[]): void {
  let unbinds = false;
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    attribute.setter(context, target, attribute);
    unbinds ||= !!attribute.unbind;
  }

  if (unbinds) {
    addCleanup(context, new AttributeUnbinding(context, target, attributes));
  }
}

/**
 * Binds a list of event listeners to an HTML element: each one is an object calling the handler of the template (see
 * `TemplateListener`), removed from the element when the context is cleared.
 *
 * @param element - The element to bind the events to.
 * @param context - The current template execution scope.
 * @param events - The list of events to bind to the element, constants of the module of the template.
 */
function bindEvents(element: Element, context: _Context, events: readonly RenderElementEvent[]): void {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const listener = new TemplateListener(element, event, context);
    element.addEventListener(event.name, listener);
    addCleanup(context, listener);
  }
}

/**
 * Binds a list of conditional bindings, creating a child context for each of them: `bind` applies
 * the bindings of the selected branch of a conditional binding to the target in its child context, which is destroyed,
 * unbinding them, as soon as another branch, or none, is selected. The conditional bindings nested in a
 * branch are bound the same way while the branch is selected.
 *
 * The selection is a binding (see `_bindSite`): it is selected again whenever a signal or a variable of the template
 * its conditions read changes. Only the selection is tracked: a selection evaluated again without changing its outcome,
 * or a signal read while binding, never binds twice.
 *
 * @template Target - What the branches bind.
 * @template Bindings - The bindings held by each branch.
 * @param context - The current template execution scope.
 * @param conditionalBindings - The list of conditional bindings to bind, constants of the module of the template.
 * @param target - What the branches bind.
 * @param bind - Applies the bindings of a branch to the target, registering their cleanup in the given context: a
 *   function of this module.
 */
function bindConditionalBindings<Target, Bindings extends { readonly conditionalBindings?: ReadonlyArray<RenderConditionalBinding<Bindings>> }>(context: _Context, conditionalBindings: ReadonlyArray<RenderConditionalBinding<Bindings>>, target: Target, bind: ConditionalBindingRun<Target, Bindings>['bind']): void {
  for (let i = 0; i < conditionalBindings.length; i++) {
    const conditionalBinding = conditionalBindings[i];
    const run: ConditionalBindingRun<Target, Bindings> = { conditionalBinding, scope: _scope(context, EMPTY_LAYOUT), target, bind, current: undefined };
    _bindSite(context, conditionalBinding, run, _runConditionalBinding);
    // Held after the binding selecting its branch, so that a refresh selects the branch before refreshing it
    addCleanup(context, run);
  }
}

/**
 * Selects the branch of a conditional binding and applies it: the callback of the binding of
 * {@link bindConditionalBindings}, shared by every conditional binding, which the compiler names in the binding. Only
 * the selection is tracked. The conditions read the variables through the context of the branch, which declares none,
 * so they read the ones of the scope.
 *
 * @template Target - What the branches bind.
 * @template Bindings - The bindings held by each branch.
 * @param _context - The context holding the conditional binding.
 * @param run - The conditional binding.
 */
export function _runConditionalBinding<Target, Bindings extends { readonly conditionalBindings?: ReadonlyArray<RenderConditionalBinding<Bindings>> }>(_context: _Context, run: ConditionalBindingRun<Target, Bindings>): void {
  const selected = _selectBranch(run.conditionalBinding, run.scope);
  untracked(() => applyBranch(run, selected));
}

/**
 * Applies the branch selected of a conditional binding, unbinding the one applied before, unless it is the same branch.
 *
 * @template Target - What the branches bind.
 * @template Bindings - The bindings held by each branch.
 * @param run - The conditional binding.
 * @param selected - The branch selected, `undefined` when no condition holds.
 */
function applyBranch<Target, Bindings extends { readonly conditionalBindings?: ReadonlyArray<RenderConditionalBinding<Bindings>> }>(run: ConditionalBindingRun<Target, Bindings>, selected: Bindings | undefined): void {
  /*
    In rare cases when the signals registered in the expression changes but the final value
    of the expression is equal to the previous one we do not perform anything
  */
  if (selected === run.current) {
    return;
  }

  const { scope, target, bind } = run;
  run.current = selected;
  clear(scope);

  /*
    Selected branch could be null if
    - No switch cases match the current value and it lacks a default value
    - No If/ElseIf match the condition and it lacks an else value
  */
  if (selected) {
    bind(target, scope, selected);
    if (selected.conditionalBindings?.length) {
      bindConditionalBindings(scope, selected.conditionalBindings, target, bind);
    }
  }
}

/**
 * Applies a branch of a conditional binding of an element: its attributes and its listeners at once, its directives once
 * the element is mounted.
 *
 * @param binding - The element.
 * @param context - The context of the branch.
 * @param branch - The branch.
 * @throws When no custom directive is registered for the selector of a directive.
 */
function bindElementBranch(binding: ElementBinding, context: _Context, branch: RenderElementConditionalBinding['branches'][number]): void {
  const { element } = binding;
  const { attributes, events, directives } = branch;
  if (attributes?.length) {
    bindProperties(element, context, attributes);
  }

  if (events?.length) {
    bindEvents(element, context, events);
  }

  if (!directives?.length) {
    return;
  }

  // A branch selected later, once the element is mounted, applies its directives at once
  if (binding.mounted) {
    bindDirectives(element, context, directives);
  } else {
    const entry = [context, directives] as const;
    binding.pending ? binding.pending.push(entry) : binding.pending = [entry];
  }
}

/**
 * Applies a branch of a conditional binding of a directive: its properties, and its listeners on the element of the
 * directive.
 *
 * @param directive - The directive.
 * @param context - The context of the branch.
 * @param branch - The branch.
 */
function bindDirectiveBranch(directive: CustomDirective, context: _Context, branch: NonNullable<RenderElementDirective['conditionalBindings']>[number]['branches'][number]): void {
  const { attributes, events } = branch;
  if (attributes?.length) {
    bindProperties(directive, context, attributes);
  }

  if (events?.length) {
    bindEvents(directive.element, context, events);
  }
}

/**
 * Applies a list of directives to an HTML element: each directive is instantiated,
 * its properties are bound and its events listened to on the element, directly or
 * through its conditional bindings, then it is started.
 * The directive is disposed when the context is destroyed.
 * @param element - The element to apply the directives to.
 * @param context - The current template execution scope.
 * @param directives - The list of directives to apply to the element.
 * @throws When no custom directive is registered for a selector, or when the element is a component already declaring the directive as a host directive.
 */
function bindDirectives(element: Element, context: _Context, directives: readonly RenderElementDirective[]): void {
  for (let i = 0; i < directives.length; i++) {
    const { selector, attributes, events, conditionalBindings } = directives[i];
    const Directive = _resolveDirective(selector, CustomDirective);
    if (element instanceof CustomElement && element.hostDirectives?.has(Directive)) {
      throw new Error(`Directive ${typeof selector === 'string' ? `"${selector}"` : Directive.name} is applied more than once on <${element.localName}>: it is already a host directive of the component`);
    }

    // Elements rendered from a template are always HTML, SVG or MathML elements, all exposing the inline style of an HTMLElement
    const directive = new Directive();
    directive[SET_DIRECTIVE_ELEMENT] = element;

    if (attributes?.length) {
      bindProperties(directive, context, attributes);
    }

    if (events?.length) {
      bindEvents(element, context, events);
    }

    if (conditionalBindings?.length) {
      bindConditionalBindings(context, conditionalBindings, directive, bindDirectiveBranch);
    }

    // Registered before connecting, so that `onDestroy` runs before the effects created in `onInit` are disposed
    addCleanup(context, () => {
      directive[DIRECTIVE_DISCONNECT]();
      _removeAppliedDirective(element, directive);
    });
    _addAppliedDirective(element, directive);
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
 *
 * In the hydration of a component, the element the server rendered is adopted when the first outcome renders it too, and
 * when the outcome is asynchronous and still pending: the element follows the outcome once it settles.
 * @param parentNode - The parent HTML element the element is rendered into.
 * @param context - The current template execution scope, owning the structural directives.
 * @param anchor - The node to insert the element before, or `null` to append it.
 * @param config - The element, applying structural directives.
 * @throws When no structural directive is registered for a selector.
 */
function renderStructuralElement(parentNode: Element, context: _Context, anchor: Comment | null, config: RenderElement): void {
  const nodeStrategy = getNodeStrategy(context);
  const { structuralDirectives, structuralConditionalBindings } = config;
  const block = nodeStrategy.block(context, parentNode, anchor, 'structural', _SSR_MARKERS.structural, config.last, config.slot);
  const elementContext = _scope(context, STRUCTURAL_LAYOUT);
  context[containerSlot(context, config.container)] = elementContext;
  const flags = signal(new Array<SignalType<boolean | undefined>>());
  const collector: StructuralCollector = {
    add: flag => flags.update(list => [...list, flag]),
    remove: flagToRemove => flags.update(list => list.filter(flag => flag !== flagToRemove))
  };

  if (structuralDirectives?.length) {
    bindStructuralDirectives(context, structuralDirectives, collector);
  }

  if (structuralConditionalBindings?.length) {
    bindConditionalBindings(context, structuralConditionalBindings, collector, bindStructuralBranch);
  }

  let rendered = false;
  let first = true;

  addCleanup(context, effect(() => {
    const shouldRender = checkRender(flags);
    if (first) {
      first = false;
      untracked(() => {
        /*
          The first outcome decides how the element is rendered: adopted when the server rendered it too. An asynchronous
          outcome still pending keeps the one of the server, which is no element when the element is not adopted
        */
        rendered = shouldRender ?? block.marker === '1';
        swapNodeStrategy(elementContext, nodeStrategy.adopt(parentNode, block, rendered ? '1' : '0'));
        rendered && renderElement(parentNode, elementContext, block.anchor, config, HEADER);
        nodeStrategy.close(parentNode, block);
      });
      return;
    }

    // Should render is undefined when one of the structural directives shouldRender effects is asynchronous and still running
    if (shouldRender === undefined || shouldRender === rendered) {
      return;
    }

    rendered = shouldRender;
    untracked(() => {
      clear(elementContext);
      shouldRender && renderElement(parentNode, elementContext, block.anchor, config, HEADER);
    });
  }));
}

/**
 * Applies a branch of a conditional binding applying structural directives: its structural directives, whose flags the
 * collector of the element gathers.
 *
 * @param collector - The collector of the flags of the structural directives of the element.
 * @param context - The context of the branch.
 * @param branch - The branch.
 * @throws When no structural directive is registered for a selector.
 */
function bindStructuralBranch(collector: StructuralCollector, context: _Context, branch: RenderElementStructuralDirectiveConditionalBinding['branches'][number]): void {
  if (branch.structuralDirectives?.length) {
    bindStructuralDirectives(context, branch.structuralDirectives, collector);
  }
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
function bindStructuralDirectives(context: _Context, structuralDirectives: readonly RenderElementStructuralDirective[], collector: StructuralCollector): void {
  for (let i = 0; i < structuralDirectives.length; i++) {
    const { selector, attributes } = structuralDirectives[i];
    const Directive = _resolveDirective(selector, StructuralDirective);
    const directive = new Directive();
    const flag = signal<boolean | undefined>(undefined);
    let evaluation = 0;

    if (attributes?.length) {
      bindProperties(directive, context, attributes);
    }

    collector.add(flag);

    const dispose = effect(() => {
      const current = ++evaluation;
      const result = directive.shouldRender();
      typeof result === 'boolean'
        ? flag.set(result)
        : result.then(value => current === evaluation && flag.set(value));
    });

    addCleanup(context, () => {
      evaluation++;
      dispose();
      collector.remove(flag);
    });
  }
}

/**
 * Sets a literal attribute value on an HTML element.
 * E.g., `<div id="example"></div>`.
 *
 * @param _context - The current template execution scope.
 * @param target - The element to set the attribute on, or the directive to set the property on.
 * @param attribute - The attribute, whose value is the literal.
 * @throws When the name is the one of an input of the target, or the target is a directive.
 */
export function _setProperty(_context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  updateProperty(target, attribute.name, attribute.value);
}

/**
 * Sets an attribute of an HTML element to the value of an expression reading nothing that can change, once: a literal,
 * e.g. `<div id="{ 'default' }"></div>`, `<div maxlength="{ 1 + 3 }"></div>`, or any expression on the server, which
 * reads every value once. It is the callback of the binding of {@link _setReactiveProperty} too.
 *
 * @param context - The current template execution scope, which the expression reads.
 * @param target - The element to set the attribute on, or the directive to set the property on.
 * @param attribute - The attribute, whose value is the expression.
 * @throws When the name is the one of an input of the target, or the target is a directive.
 */
export function _setExpressionProperty(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  updateProperty(target, attribute.name, evaluate(attribute, context));
}

/**
 * Sets an attribute of an HTML element to the value of an expression, again whenever a signal or a variable of the
 * template it reads changes (see `_bindSite`), its callback being {@link _setExpressionProperty}. E.g.,
 * `<div id="{ mySignal() }"></div>`, `<td class="{ row.kind }"></td>`.
 *
 * @param context - The current template execution scope, which the expression reads and which disposes the binding.
 * @param target - The element to set the attribute on, or the directive to set the property on.
 * @param attribute - The attribute, whose value is the expression, and whose `reads` lists the variables of the template
 *   it reads, if any.
 * @throws When the name is the one of an input of the target, or the target is a directive.
 */
export function _setReactiveProperty(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  _bindSite(context, attribute, target, _setExpressionProperty);
}

/**
 * Sets a literal input of a component, e.g. `<app-badge label="New" />`, by the name of its property: on an element
 * whose class is not defined yet the property is assigned, which `@Property` recovers once the class is defined.
 *
 * @param _context - The current template execution scope.
 * @param target - The element of the component.
 * @param attribute - The input, by the name of its property, whose value is the literal.
 * @throws When the target is a directive not declaring the property.
 */
export function _setInput(_context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  updateInput(target, attribute.name, attribute.value);
}

/**
 * Sets an input of a component bound to an expression reading nothing that can change, once, by the name of its property
 * (see {@link _setInput}): a literal, or any expression on the server, which reads every value once. It is the callback
 * of the binding of {@link _setReactiveInput} too.
 *
 * @param context - The current template execution scope, which the expression reads.
 * @param target - The element of the component.
 * @param attribute - The input, by the name of its property, whose value is the expression.
 * @throws When the target is a directive not declaring the property.
 */
export function _setExpressionInput(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  updateInput(target, attribute.name, evaluate(attribute, context));
}

/**
 * Sets an input of a component bound to an expression, by the name of its property, again whenever a signal or a
 * variable of the template it reads changes (see {@link _setInput} and `_bindSite`), its callback being
 * {@link _setExpressionInput}.
 *
 * @param context - The current template execution scope, which the expression reads and which disposes the binding.
 * @param target - The element of the component.
 * @param attribute - The input, by the name of its property, whose value is the expression, and whose `reads` lists the
 *   variables of the template it reads, if any.
 * @throws When the target is a directive not declaring the property.
 */
export function _setReactiveInput(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  _bindSite(context, attribute, target, _setExpressionInput);
}

/**
 * Removes an attribute from an HTML element. Removing `class` keeps the classes toggled by class bindings.
 *
 * @param _context - The current template execution scope.
 * @param element - The element to remove the attribute from.
 * @param attribute - The attribute to remove.
 */
export function _removeAttribute(_context: _Context, element: Element, attribute: RenderElementAttribute): void {
  const { name } = attribute;
  element.removeAttribute(name);
  restoreBindings(element, name);
}

/**
 * Resets an input of a custom element or of a directive to the default value declared by its `@Property`,
 * evaluated where the property is declared. On an element without such a property, e.g. a custom element
 * not defined yet, the value assigned to the property and the attribute are removed.
 *
 * @param _context - The current template execution scope.
 * @param target - The element or the directive whose input is reset.
 * @param attribute - The input, by the name of its property.
 * @throws When the target is a directive not declaring the property.
 */
export function _resetProperty(_context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  const { name } = attribute;
  const input = inputOf(target, name);
  if (input) {
    input.reset(INPUT_SIGNAL_SET_SYMBOL);
    return;
  }

  const element = target as Element;
  delete (element as unknown as Record<string, unknown>)[name];
  element.removeAttribute(name);
  restoreBindings(element, name);
}

/**
 * Computes the value of an attribute bound to an expression, calling the function of the module of the template with
 * the component as `this` and the context.
 *
 * @param attribute - The attribute, whose value is the expression.
 * @param context - The context the binding lives in.
 * @returns The value.
 */
function evaluate(attribute: RenderElementAttribute, context: _Context): unknown {
  return (attribute.value as TemplateExpression<unknown>).call(context[COMPONENT], context);
}

/**
 * Updates an input of a component or of a directive: when the class of the component is defined the value is set into
 * the input signal, otherwise it is assigned to the property of the element, which `@Property` recovers once the class
 * is defined.
 *
 * @param target - The element of the component, or the directive.
 * @param name - The name of the property of the input.
 * @param newValue - The new value.
 * @throws When the target is a directive not declaring the property.
 */
function updateInput(target: Element | BindingHost, name: string, newValue: unknown): void {
  const input = inputOf(target, name);
  input
    ? input.set(newValue, INPUT_SIGNAL_SET_SYMBOL)
    : (target as unknown as Record<string, unknown>)[name] = newValue;
}

/**
 * Updates an attribute of an HTML element, only when the value differs from the one the element holds, as an element
 * adopted from the HTML of the server does: the value is written as `@HostProperty` writes it (see `_attributeValue`),
 * `null` and `undefined` removing it. Writing `class` keeps the classes toggled by class bindings.
 *
 * An input is never written by it: the compiler binds the inputs it knows through the setters of the inputs, so an
 * input found here is one it did not recognize, e.g. the name of the property of an input declaring an alias.
 * @param target - The HTML element whose attribute is being updated.
 * @param name - The name of the attribute.
 * @param newValue - The new value to set for the attribute.
 * @throws When `name` is the one of an input of the target, or the target is a directive.
 */
function updateProperty(target: Element | BindingHost, name: string, newValue: unknown): void {
  if (inputOf(target, name)) {
    throw new Error(`"${name}" is an input of ${target.constructor.name}, bound as an attribute: an input declaring an alias is bound by its alias`);
  }

  writeAttribute(target as Element, name, newValue);
}

/**
 * Returns the InputSignal backing the property `name` of an HTML element or of a directive, `null` when no InputSignal
 * backs it, as for an attribute of an element. `name` is the one of the property, never an alias, which the compiler
 * resolves.
 *
 * @param target - The HTML element or the directive owning the property.
 * @param name - The name of the property.
 * @returns The InputSignal, `null` for an element without it.
 * @throws When the target is a directive not declaring the property.
 */
function inputOf(target: Element | BindingHost, name: string): SettableInputSignal | null {
  const property = (target as unknown as Record<string, unknown>)[name];
  if (property && isInputSignal(property)) {
    return property;
  }

  if (target instanceof CustomDirective || target instanceof StructuralDirective) {
    throw new Error(`${target.constructor.name} does not declare a property named "${name}"`);
  }

  return null;
}
