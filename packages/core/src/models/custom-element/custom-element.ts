import { keys } from '@xaendar/common';
import type { Constructor, NoArgsVoidFunction } from '@xaendar/types';
import { _CLIENT_ATTRIBUTE, _HYDRATE_ATTRIBUTE, _SERVER_INPUTS_ATTRIBUTE, CONNECTED_HOOKS, DIRECTIVE_AFTER_RENDER, DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, DISCONNECTED_HOOKS, HYDRATE, INITIALIZE, INTERNAL_EXTENDS, INTERNAL_SHADOW_ROOT, IS_RENDERED, WAITS_FOR_HYDRATION } from '../../costants';
import { isInputSignal } from '../../signals/input/input-instance.symbol';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import { EffectOptions } from '../../signals/types/effect-options.type';
import type { _Context } from '../../types/context.type';
import type { ComponentRef } from '../../types/create-component/component-ref.type';
import type { CreateComponentOptionsWithOptionalTarget } from '../../types/create-component/create-component-options-with-optional-target.type';
import type { RenderDefinition } from '../../types/render-definition.type';
import type { HostDirectives } from '../../types/web-component/host-directives.type';
import { claimShadowRoot, isClaimed, releaseClaim } from '../../utils/claim-nodes/claim-nodes.util';
import { _getComponentRuntime } from '../../utils/component-runtime/component-runtime.util';
import { _scope, addCleanup, clear, EMPTY_LAYOUT, moveTo, removeCleanup } from '../../utils/context/context.util';
import { CREATE_NODES } from '../../utils/create-nodes/create-nodes.util';
import { getWebComponentMetadata } from '../../utils/get-metadata/get-metadata.util';
import { _bindHost } from '../../utils/host-bindings/host-bindings.util';
import { _checkExposedFields, _createHostDirectives } from '../../utils/host-directives/host-directives.util';
import { HYDRATION } from '../../utils/hydration-flag/hydration-flag.util';
import { deferElementHydration, replayContractEvents, replayElementEvents } from '../../utils/hydration-triggers/hydration-triggers.util';
import { adoptStyleSheets } from '../../utils/adopt-style-sheets/adopt-style-sheets.util';
import { _getRender } from '../../utils/render-registry/render-registry.util';
import { reportError } from '../../utils/report-error/report-error.util';
import { adoptHostServerStyle } from '../../utils/server-styles/server-styles.util';
import { _parseState } from '../../utils/state-serialization/state-serialization.util';
import { runConnection } from '../../utils/try-scope/try-scope.util';
import type { CustomDirective } from '../custom-directive/custom-directive';

/**
 * Base class for all custom elements registered via `@WebComponent`.
 *
 * Extends `HTMLElement` with Shadow DOM support and the lifecycle hooks
 * required for signal-based rendering. Concrete component classes should
 * extend this class and be decorated with `@WebComponent`; a customized built-in element extends instead the class
 * `customElementOf` creates on the class of the native element it extends, which shares this prototype.
 *
 * N.B. Deliberate, so that the code of a component is written once for every class it may extend: the state of the
 * element is initialized by {@link INITIALIZE}, which the constructor of the classes of `customElementOf` calls too, and
 * the fields are only declared, instead of field initializers, which only the constructor of this class would run. Do not
 * initialize a field where it is declared.
 */
export class CustomElement extends HTMLElement {
  /**
   * Internal callbacks invoked by the runtime each time the element is inserted into the DOM,
   * right after the render. They are never cleared, so they survive the reconnections.
   */
  public declare [CONNECTED_HOOKS]: Array<NoArgsVoidFunction> | null;
  /**
   * Internal callbacks invoked by the runtime each time the element is removed from the DOM,
   * after the context is cleared. They are never cleared, so they survive the reconnections.
   */
  public declare [DISCONNECTED_HOOKS]: Array<NoArgsVoidFunction> | null;
  /**
   * The custom directives declared by `hostDirectives` of `@WebComponent`, applied to this element, keyed by the class
   * of the directive: their properties and methods can be used by the component and by its template.
   * Empty when the component declares none.
   */
  public declare hostDirectives: HostDirectives;
  /**
   * The active template execution context for this component instance,
   * holding all identifier bindings and registered cleanup functions.
   */
  private declare _context: _Context;
  /**
   * The context the host directives are connected to: it lives from the connection to the disconnection of the element,
   * disposing the effects of the directives.
   */
  private declare _hostDirectivesContext: _Context | null;
  /**
   * Where the element is in its life:
   * - `hydrating`: written by the server and not rendered in the browser yet, so it waits for its first render: its
   *   declarative shadow root holds the HTML of the server, or the component renders only in the browser (see
   *   {@link _CLIENT_ATTRIBUTE});
   * - `idle`: any other element not rendered yet;
   * - `rendering`: from the start of its render to the end of its connected hooks, the ones of the query signals created
   *   so far;
   * - `rendered`: from then to its removal from the DOM, a query signal created meanwhile starting at once (see
   *   {@link IS_RENDERED});
   * - `destroyed`: removed from the DOM, its effects and listeners disposed, its shadow root holding what it rendered
   *   until it is inserted again, if ever (see {@link connectedCallback}).
   *
   * Never `hydrating` in an application not rendered on the server (see `HYDRATION`), whose bundle has no hydration.
   */
  private declare _state: 'hydrating' | 'idle' | 'rendering' | 'rendered' | 'destroyed';
  /**
   * The root of the Web Component, where the content is rendered: the declarative shadow root of an element rendered on
   * the server, which `attachShadow` would empty, or a new one. `null` for a customized built-in element without a
   * template, which renders nothing: its content is the one its tag holds, which a shadow root would hide, and most of
   * the native elements accept no shadow root.
   */
  private declare _root: ShadowRoot | null;

  /**
   * Creates the element and the host directives declared by its `@WebComponent`, applied to it.
   *
   * @throws When a host directive is declared twice or exposes an input or an event it does not declare.
   */
  constructor() {
    super();
    this[INITIALIZE]();
  }

  /**
   * Optional lifecycle hook, invoked each time the element is inserted into the DOM, before the render:
   * the Shadow DOM is still empty.
   */
  public onInit?(): void;

  /**
   * Optional lifecycle hook, invoked each time the element is inserted into the DOM, right after the render:
   * the Shadow DOM tree has been built and its signal subscriptions set up.
   */
  public afterRender?(): void;

  /**
   * Creates a signal effect bound to the lifecycle of this component:
   * it is disposed automatically when the component is disconnected.
   * It can be called at any time: in the constructor, in a field initializer, or in `onInit` before the first render.
   *
   * @param fn - The side-effectful function to run. Any Signal read inside it
   *   is tracked as a dependency.
   * @param options - Optional settings forwarded to the underlying effect.
   * @returns A function that disposes the effect ahead of the disconnection. It does nothing when the effect is
   *   already disposed: when it is called a second time, or after the disconnection.
   */
  public effect(fn: NoArgsVoidFunction, options?: EffectOptions): NoArgsVoidFunction {
    const stop = _getComponentRuntime().effect(fn, options);
    addCleanup(this._context, stop);

    return () => {
      removeCleanup(this._context, stop);
      stop();
    };
  }

  /**
   * Creates a component bound to the lifecycle of this component and appends it to the target, binding its inputs and its
   * events, applying directives to it and appending the content to it, as a template does for the tag of the component:
   * the inputs are set before the element is mounted, so that its `onInit` reads them, the directives are applied and the
   * content appended once it is.
   *
   * The value of an input is given by a getter, run in an effect: the input follows the signals the getter reads. A group of
   * inputs or of events with a `condition` is bound only while the condition holds, as an `@if` written in the tag: as soon as
   * it doesn't, its inputs go back to their default value and its events are no longer listened to. A directive with a
   * `condition` is applied while the condition holds, and a new instance of it each time the condition holds again.
   *
   * The component is destroyed when this component is disconnected, right after the effects created via {@link effect}, or
   * earlier by `destroy` of the returned reference. It can be created at any time: in the constructor, in a field initializer,
   * or in `onInit` before the first render. The creation is not tracked by an effect it is called in.
   *
   * @example
   * ```ts
   * const toast = this.createComponent(ToastComponent, {
   *   target: document.body,
   *   properties: [{ message: () => this.message() }, { condition: () => this.urgent(), level: () => 'error' }],
   *   events: [{ closed: () => toast.destroy() }],
   *   directives: [TooltipDirective],
   *   content: [icon]
   * });
   * ```
   *
   * @param component - The class of the component, decorated with `@WebComponent`.
   * @param options - The target the component is appended to, the groups of its inputs and of its events, the directives
   *   applied to it and its content. Without `target`, or without options at all, the component is appended to the element of this
   *   component, its host element.
   * @returns The element of the component, along with the function destroying it ahead of the disconnection.
   * @throws When the class is not decorated with `@WebComponent`, when an input is bound by more than one group, when a directive is not
   * a custom directive, or when it is already a host directive of the component.
   */
  public createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options?: CreateComponentOptionsWithOptionalTarget<Component, Directives>): ComponentRef<Component> {
    const actualOptions = Object.assign({}, options, { target: options?.target ?? this });
    return _getComponentRuntime().createComponent(() => this._context, component, actualOptions);
  }

  /**
   * Tells whether a value is an element of this class. For `CustomElement` itself, the element of any component, the
   * customized built-in ones included: their classes extend the class `customElementOf` creates on the class of their
   * tag, which shares the prototype of `CustomElement` without inheriting from it.
   *
   * @param value - The value.
   * @returns `true` when the value is an element of this class.
   */
  public static [Symbol.hasInstance](value: unknown): boolean {
    return this === CustomElement ? typeof value === 'object' && value !== null && INITIALIZE in value : Function.prototype[Symbol.hasInstance].call(this, value);
  }

  /**
   * Initializes the state of the element and creates the host directives declared by its `@WebComponent`, applied to it:
   * called by the constructor of this class and by the one of the classes `customElementOf` creates, which share its
   * prototype.
   *
   * @throws When a host directive is declared twice or exposes an input or an event it does not declare.
   */
  public [INITIALIZE](): void {
    this[CONNECTED_HOOKS] = null;
    this[DISCONNECTED_HOOKS] = null;
    this._context = _scope(null, EMPTY_LAYOUT);
    this._hostDirectivesContext = null;
    this._state = HYDRATION && (this.shadowRoot || this.hasAttribute(_CLIENT_ATTRIBUTE)) ? 'hydrating' : 'idle';
    const metadata = getWebComponentMetadata(this.constructor);
    this._root = this.shadowRoot ?? (!metadata?.[INTERNAL_EXTENDS] || _getRender(this.constructor) ? this.attachShadow({ ...metadata?.[INTERNAL_SHADOW_ROOT], mode: 'open' }) : null);
    
    const hostDirectives = _createHostDirectives(this);
    this.hostDirectives = hostDirectives;
    if (hostDirectives.size) {
      this._hostDirectivesContext = _scope(null, EMPTY_LAYOUT);
    }
  }

  /**
   * Starts the hydration of an element rendered on the server inside the shadow root of another component, once that
   * component has adopted the element and set its inputs, as inserting the element connects a component rendered in
   * the browser, or of an element whose trigger fires (see `deferElementHydration`). Does nothing once the element is
   * rendered, nor while it is out of the page: removed before its trigger fires, it hydrates when it is inserted again.
   */
  public [HYDRATE](): void {
    if (this._state === 'hydrating' && this.isConnected) {
      this.connectedCallback();
    }
  }

  /**
   * Tells whether the element still waits for its first render, so that the events on it are not replayed yet: one
   * declaring `hydrate: 'never'` does not, since it has no render to wait for.
   *
   * @returns `true` when it waits.
   */
  public [WAITS_FOR_HYDRATION](): boolean {
    return this._state === 'hydrating' && this.getAttribute(_HYDRATE_ATTRIBUTE) !== 'never';
  }

  /**
   * Tells whether the element is rendered and has run its connected hooks, so that a query signal created from now on,
   * lazily, starts at once instead of waiting for the hooks of the next connection.
   *
   * @returns `true` from the end of the connected hooks to the removal of the element.
   */
  public [IS_RENDERED](): boolean {
    return this._state === 'rendered';
  }

  /**
   * Called by the browser engine each time the element is inserted into the DOM.
   *
   * An element rendered on the server inside the shadow root of another component waits for it: that component adopts
   * the element and sets its inputs, then starts its hydration (see {@link HYDRATE}), as it would insert it in the
   * browser. The root of a page starts it at once. Either one waits for the trigger its `@WebComponent` declares, if any,
   * and replays the events recorded meanwhile once it is hydrated, along with the ones the event contract recorded on the
   * page before the runtime was there.
   *
   * Sets the inputs the server rendered the element with, when it is the root of a page rendered on the server (see
   * {@link _restoreServerInputs}) and the inline style the server moved into a `<style>` (see `adoptHostServerStyle`),
   * adopts the stylesheet registered for this component class (see `_defineRender`), if any,
   * and invokes `onInit`, if declared. Then triggers the render by invoking the compiler-generated render
   * function registered for it, which builds the Shadow DOM tree, or adopts the one the server rendered, and sets up
   * reactive signal subscriptions (a customized built-in element without a template renders nothing), then invokes the
   * internal connected hooks
   * (e.g. the ones of the query signals), binds the attributes, the classes and the events declared by `@HostAttribute`
   * and `@HostListener`, and finally invokes `afterRender`, if declared.
   *
   * Mounted by a template inside a `@try`, its error is thrown by the template, which the `@try` catches (see
   * `runConnection`).
   *
   * An element inserted again after its removal renders again, its shadow root emptied of what it rendered before. A
   * component of that content does not: the browser connects it along with the element holding it, after the element
   * has emptied its shadow root, so it is no longer in the DOM, and stays destroyed.
   *
   * @throws When no render function is registered for this component class, when a field of the component has the name
   *   an input of a host directive is exposed with, and the error of the code of the component, unless a template mounts
   *   it inside a `@try`.
   */
  private connectedCallback(): void {
    if (this._state !== 'destroyed' || this.isConnected) {
      runConnection(() => this._connect());
    }
  }

  /**
   * Called by the browser engine each time the element is removed from the DOM.
   *
   * Invokes `onDestroy`, if declared, then invokes `context.clear()` to dispose the effects
   * created via {@link effect} and all the other active signal subscriptions and detach event listeners,
   * and finally invokes the internal disconnected hooks.
   *
   * The nodes of the template are not removed: a component removed from the DOM is destroyed, and its shadow root goes
   * with it. When code outside Xaendar inserts it again, as a library moving it with `insertBefore` does, it renders
   * again, emptying its shadow root first (see {@link connectedCallback}).
   *
   * An element rendered on the server removed before hydrating, as the ones of a `@placeholder`, never started: only what
   * its constructor created is disposed. A component already destroyed, disconnected again by the element holding it
   * as that element empties its shadow root, has nothing left to dispose.
   */
  private disconnectedCallback(): void {
    switch (this._state) {
      case 'hydrating':
        clear(this._context, false);
        this._clearHostDirectivesContext();
        return;

      case 'destroyed':
        return;
    }

    this._state = 'destroyed';
    // The component is disposed also when `onDestroy` throws, whose error the browser then reports
    try {
      this.onDestroy?.();
    } finally {
      this._dispose();
    }
  }

  /**
   * Disposes the component being destroyed, after its `onDestroy` (see {@link disconnectedCallback}): clears its context,
   * stops its host directives, a throwing one reported in a microtask so that the others stop too, clears their
   * context, and invokes the internal disconnected hooks.
   */
  private _dispose(): void {
    clear(this._context, false);

    // The host directives are stopped after the component, then their effects are disposed
    for (const directive of this.hostDirectives.values()) {
      try {
        directive[DIRECTIVE_DISCONNECT]();
      } catch (error) {
        reportError(error);
      }
    }

    this._clearHostDirectivesContext();

    const disconnectedHooks = this[DISCONNECTED_HOOKS];
    if (disconnectedHooks) {
      for (let i = 0; i < disconnectedHooks.length; i++) {
        disconnectedHooks[i]();
      }
    }
  }

  /**
   * Called by the browser engine, in place of `disconnectedCallback` and `connectedCallback`, when the element is
   * moved with `moveBefore`, as `@for` does with the rows it reuses: the element stays the same, with its render,
   * its state and its effects, so there is nothing to do.
   */
  private connectedMoveCallback(): void {
    // Declaring it is what keeps the element from being disconnected and connected again
  }

  /**
   * Connects the element, see {@link connectedCallback}.
   *
   * @throws When no render function is registered for this component class, when a field of the component has the name
   *   an input of a host directive is exposed with, and the error of the code of the component.
   */
  private _connect(): void {
    const state = this._state;
    // The guard of the whole hydration: without it, the bundle of an application not rendered on the server has none
    const hydrating = HYDRATION && state === 'hydrating';
    if (hydrating && this._waitsForHydration()) {
      return;
    }

    // Only a customized built-in element without a template has no shadow root, and no render function (see `_root`)
    const root = this._root;
    const definition = _getRender(this.constructor);
    if (root && !definition) {
      throw new Error(`${this.constructor.name} does not seem to have a Render Function`);
    }

    // The fields exist only once the constructors of the subclasses have run
    if (this._hostDirectivesContext) {
      _checkExposedFields(this);
    }

    if (hydrating) {
      this._restoreServerInputs();
      // The root of a page, or a component a static one renders: no component adopting it took its inline style
      adoptHostServerStyle(this);
    }

    /*
      Waiting for its first render, it has a declarative shadow root unless it renders only in the browser, or it is a
      customized built-in element without a template: the server writes no shadow root with `data-xd-client`. Read here,
      the element keeps no field for it once hydrated
    */
    const serverRoot = hydrating && !this.hasAttribute(_CLIENT_ATTRIBUTE);
    if (hydrating) {
      this.removeAttribute(_CLIENT_ATTRIBUTE);
    }

    root && definition ? this._render(root, definition, state, serverRoot) : this._start();
    const connectedHooks = this[CONNECTED_HOOKS];
    if (connectedHooks) {
      for (let i = 0; i < connectedHooks.length; i++) {
        connectedHooks[i]();
      }
    }

    // The query signals created from now on start at once (see `IS_RENDERED`)
    this._state = 'rendered';
    // Bound once the queries are up to date, so a `@HostAttribute` can read them
    _bindHost(this, this, this._context);
    // The host directives, started before the component, see it rendered before it does
    for (const directive of this.hostDirectives.values()) {
      directive[DIRECTIVE_AFTER_RENDER]();
    }

    this.afterRender?.();
    // Hydrated: nothing keeps the marks of its adoption any longer
    if (hydrating) {
      releaseClaim(this);
      replayElementEvents(this);
      replayContractEvents();
    }
  }

  /**
   * Renders the template of the component into its shadow root, starting the host directives and the component once
   * the root is ready (see {@link _start}).
   *
   * @param root - The shadow root of the element.
   * @param definition - The render function and the stylesheets registered for the class of the component.
   * @param state - The state of the element before the connection: one destroyed empties its shadow root first.
   * @param serverRoot - Whether the shadow root holds the HTML of the server, which the render adopts.
   * @throws The error of the code of the component.
   */
  private _render(root: ShadowRoot, definition: RenderDefinition, state: CustomElement['_state'], serverRoot: boolean): void {
    const { render, styleSheets } = definition;
    if (styleSheets) {
      adoptStyleSheets(root, styleSheets);
    }

    // Destroyed, its shadow root holds what it rendered before its removal, moved along with it by code outside Xaendar
    if (state === 'destroyed' && root.firstChild) {
      root.replaceChildren();
    }

    // The first render of an element rendered on the server adopts its nodes, any other one creates them
    const nodeStrategy = serverRoot ? claimShadowRoot(root) : CREATE_NODES;
    this._start();
    /*
      The context of the render exists only once the render has ended: the effects and the components
      created in the constructor, in a field initializer or in onInit wait in a staging context,
      moved to the real one when the render has ended
    */
    const staging = this._context;
    this._context = render.call(this, nodeStrategy);
    nodeStrategy.end(root, this._context);
    moveTo(staging, this._context);
  }

  /**
   * Starts the host directives, then the component, invoking its `onInit`: right before its render, or alone for a
   * customized built-in element without a template, whose effects and components stay in the context they are created in.
   *
   * @throws The error of the code of the component.
   */
  private _start(): void {
    this._state = 'rendering';
    /*
      The host directives are started before the component, so its `onInit` finds them ready
      ! is a safe assertion because if hostDirective has at least 1 value the context has been initialized
    */
    for (const directive of this.hostDirectives.values()) {
      directive[DIRECTIVE_CONNECT](this._hostDirectivesContext!);
    }

    this.onInit?.();
  }

  /**
   * Tells whether an element rendered on the server waits to be hydrated. Inside the shadow root of another component, it
   * waits for that component to adopt it, then for the trigger its `@WebComponent` declares, whose firing removes the
   * attribute holding it. The root of a page waits only for its trigger, which hydrates it once it fires, and so does an
   * element holding its inputs in `data-xd-inputs` in the shadow root of a static component, which never adopts it.
   *
   * @returns `true` when the element waits.
   */
  private _waitsForHydration(): boolean {
    return HYDRATION && (this.getRootNode() instanceof ShadowRoot && !this.hasAttribute(_SERVER_INPUTS_ATTRIBUTE)
      ? !isClaimed(this) || this.hasAttribute(_HYDRATE_ATTRIBUTE)
      : deferElementHydration(this, () => this[HYDRATE]()));
  }

  /**
   * Clears the scope the host directives are connected to, if the component declares any, leaving the DOM as it is.
   */
  private _clearHostDirectivesContext(): void {
    if (this._hostDirectivesContext) {
      clear(this._hostDirectivesContext, false);
    }
  }

  /**
   * Sets the inputs the server rendered the element with, when it is the root of a page rendered on the server, or a
   * component a static one renders: no template sets them in the browser, so `renderToString` writes them into the
   * `data-xd-inputs` attribute of the element, by the names of their properties. Read only while the element hydrates,
   * they are set into the input signals, the ones its host directives expose included, as `renderToString` set them, and
   * the attribute is removed, so that the element is the one the browser would render.
   *
   * N.B. The attribute is part of the HTML, which may not come from the server: a name that is not an input throws,
   * never assigned to the element, or HTML injected with it (`data-xd-inputs='{"innerHTML": …}'`) would write any property
   * of the element, its `innerHTML` or its prototype (`__proto__`) included. Do not assign the values to the properties.
   *
   * @throws When a name written into the attribute is not an input of the component.
   */
  private _restoreServerInputs(): void {
    if (!this.hasAttribute(_SERVER_INPUTS_ATTRIBUTE)) {
      return;
    }

    const serialized = this.getAttribute(_SERVER_INPUTS_ATTRIBUTE)!;
    this.removeAttribute(_SERVER_INPUTS_ATTRIBUTE);
    const inputs = _parseState<Record<string, unknown>>(serialized);
    const names = keys(inputs);
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const input: unknown = this[name as keyof this];
      if (!isInputSignal(input)) {
        throw new Error(`${this.constructor.name} does not declare an input named "${name}", written into its ${_SERVER_INPUTS_ATTRIBUTE} attribute`);
      }

      input.set(inputs[name], INPUT_SIGNAL_SET_SYMBOL);
    }
  }

  /**
   * Optional lifecycle hook, invoked each time the element is removed from the DOM, before the effects
   * created via {@link effect} are disposed, the components created via {@link createComponent} are destroyed
   * and the rendered content is removed.
   */
  public onDestroy?(): void;
}
