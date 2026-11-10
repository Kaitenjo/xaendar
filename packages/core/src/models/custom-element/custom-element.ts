import { keys } from '@xaendar/common';
import type { Constructor, NoArgsVoidFunction } from '@xaendar/types';
import { _CLIENT_ATTRIBUTE, _HYDRATE_ATTRIBUTE, _SERVER_INPUTS_ATTRIBUTE, CONNECTED_HOOKS, DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, DISCONNECTED_HOOKS, HYDRATE, WAITS_FOR_HYDRATION } from '../../costants';
import { EffectOptions } from '../../signals/types/effect-options.type';
import type { ComponentRef } from '../../types/create-component/component-ref.type';
import type { CreateComponentOptions } from '../../types/create-component/create-component-options.type';
import type { HostDirectives } from '../../types/web-component/host-directives.type';
import { claimShadowRoot, isClaimed } from '../../utils/claim-nodes/claim-nodes.util';
import { _getComponentRuntime } from '../../utils/component-runtime/component-runtime.util';
import { _Context, _EMPTY_CONTEXT } from '../../utils/context/context.util';
import { CREATE_NODES } from '../../utils/create-nodes/create-nodes.util';
import { _bindHost } from '../../utils/host-bindings/host-bindings.util';
import { deferElementHydration, replayContractEvents, replayElementEvents } from '../../utils/hydration-triggers/hydration-triggers.util';
import { _createHostDirectives } from '../../utils/host-directives/host-directives.util';
import { _getRender } from '../../utils/render-registry/render-registry.util';
import { _parseState } from '../../utils/state-serialization/state-serialization.util';
import { runConnection } from '../../utils/try-scope/try-scope.util';
import type { CustomDirective } from '../custom-directive/custom-directive';

/**
 * Base class for all custom elements registered via `@WebComponent`.
 *
 * Extends `HTMLElement` with Shadow DOM support and the lifecycle hooks
 * required for signal-based rendering. Concrete component classes should
 * extend this class and be decorated with `@WebComponent`.
 */
export class CustomElement extends HTMLElement {
  /**
   * Internal callbacks invoked by the runtime each time the element is inserted into the DOM,
   * right after the render. They are never cleared, so they survive the reconnections.
   */
  public [CONNECTED_HOOKS]: Array<NoArgsVoidFunction> | null = null;
  /**
   * Internal callbacks invoked by the runtime each time the element is removed from the DOM,
   * after the context is cleared. They are never cleared, so they survive the reconnections.
   */
  public [DISCONNECTED_HOOKS]: Array<NoArgsVoidFunction> | null = null;
  /**
   * The custom directives declared by `hostDirectives` of `@WebComponent`, applied to this element, keyed by the class
   * of the directive: their properties and methods can be used by the component and by its template.
   * Empty when the component declares none.
   */
  public readonly hostDirectives: HostDirectives;
  /**
   * The active template execution context for this component instance,
   * holding all identifier bindings and registered cleanup functions.
   */
  private _context = new _Context(_EMPTY_CONTEXT);
  /**
   * The context the host directives are connected to: it lives from the connection to the disconnection of the element,
   * disposing the effects of the directives.
   */
  private _hostDirectivesContext: _Context | null = null;
  /**
   * Whether the element was written by the server and not rendered in the browser yet, so it waits for its first render:
   * its declarative shadow root holds the HTML of the server, or the component renders only in the browser (see
   * {@link _CLIENT_ATTRIBUTE}).
   */
  private _hydrating = this.shadowRoot !== null || this.hasAttribute(_CLIENT_ATTRIBUTE);
  /**
   * Whether the element has a declarative shadow root, whose nodes its first render adopts instead of creating them (the
   * hydration).
   */
  private readonly _hasServerRoot = !!this.shadowRoot;
  /**
   * The root of the Web Component, where the content is rendered: the declarative shadow root of an element rendered on
   * the server, which `attachShadow` would empty, or a new one.
   */
  private readonly _root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });

  /**
   * Creates the element and the host directives declared by its `@WebComponent`, applied to it.
   *
   * @throws When a host directive is declared twice or exposes an input or an event it does not declare.
   */
  constructor() {
    super();
    this.hostDirectives = _createHostDirectives(this);
    if (this.hostDirectives.size) {
      this._hostDirectivesContext = new _Context(_EMPTY_CONTEXT);
    }
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
   * @returns A function that disposes the effect ahead of the disconnection. It throws when the effect is
   *   already disposed: when it is called a second time, or after the disconnection.
   */
  public effect(fn: NoArgsVoidFunction, options?: EffectOptions): NoArgsVoidFunction {
    const stop = _getComponentRuntime().effect(fn, options);
    this._context.addUnlistener(stop);

    return () => {
      this._context.removeUnlistener(stop);
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
   *   applied to it and its content.
   * @returns The element of the component, along with the function destroying it ahead of the disconnection.
   * @throws When the class is not decorated with `@WebComponent`, when an input is bound by more than one group, when a directive is not
   * a custom directive, or when it is already a host directive of the component.
   */
  public createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<Component, Directives>): ComponentRef<Component> {
    return _getComponentRuntime().createComponent(() => this._context, component, options);
  }

  /**
   * Starts the hydration of an element rendered on the server inside the shadow root of another component, once that
   * component has adopted the element and set its inputs, as inserting the element connects a component rendered in
   * the browser. Does nothing once the element is rendered.
   */
  public [HYDRATE](): void {
    if (this._hydrating && this.isConnected) {
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
    return this._hydrating && this.getAttribute(_HYDRATE_ATTRIBUTE) !== 'never';
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
   * {@link _restoreServerInputs}), adopts the stylesheet registered for this component class (see `_defineRender`), if any,
   * and invokes `onInit`, if declared. Then triggers the render by invoking the compiler-generated render
   * function registered for it, which builds the Shadow DOM tree, or adopts the one the server rendered, and sets up
   * reactive signal subscriptions, then invokes the internal connected hooks
   * (e.g. the ones of the query signals), binds the attributes, the classes and the events declared by `@HostProperty`
   * and `@HostEvent`, and finally invokes `afterRender`, if declared.
   *
   * Mounted by a template inside a `@try`, its error is thrown by the template, which the `@try` catches (see
   * `runConnection`).
   *
   * @throws When no render function is registered for this component class, and the error of the code of the component,
   *   unless a template mounts it inside a `@try`.
   */
  private connectedCallback(): void {
    runConnection(() => this._connect());
  }

  /**
   * Called by the browser engine each time the element is removed from the DOM.
   *
   * Invokes `onDestroy`, if declared, then invokes `context.clear()` to dispose the effects
   * created via {@link effect} and all the other active signal subscriptions, detach event listeners,
   * and remove tracked DOM nodes so the component can be cleanly re-rendered if it is re-inserted,
   * and finally invokes the internal disconnected hooks.
   *
   * An element rendered on the server removed before hydrating, as the ones of a `@placeholder`, never started: only what
   * its constructor created is disposed.
   */
  private disconnectedCallback(): void {
    if (this._hydrating) {
      this._context.clear();
      this._hostDirectivesContext?.clear();
      return;
    }

    this.onDestroy?.();
    this._context.clear();

    // The host directives are stopped after the component, then their effects are disposed
    for (const directive of this.hostDirectives.values()) {
      directive[DIRECTIVE_DISCONNECT]();
    }

    this._hostDirectivesContext?.clear();

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
   * @throws When no render function is registered for this component class, and the error of the code of the component.
   */
  private _connect(): void {
    const hydrating = this._hydrating;
    if (hydrating && this._waitsForHydration()) {
      return;
    }

    const definition = _getRender(this.constructor);
    if (!definition) {
      throw new Error(`${this.constructor.name} does not seem to have a Render Function`);
    }

    this._restoreServerInputs();
    if (hydrating) {
      this.removeAttribute(_CLIENT_ATTRIBUTE);
    }

    const { render, styleSheet } = definition;
    if (styleSheet) {
      this._root.adoptedStyleSheets = [styleSheet];
    }

    // The first render of an element rendered on the server adopts its nodes, any other one creates them
    const nodeStrategy = hydrating && this._hasServerRoot ? claimShadowRoot(this._root, !!styleSheet) : CREATE_NODES;
    this._hydrating = false;

    /*
      The host directives are started before the component, so its `onInit` finds them ready
      ! is a safe assertion because if hostDirective has at least 1 value the context has been initialized
    */
    for (const directive of this.hostDirectives.values()) {
      directive[DIRECTIVE_CONNECT](this._hostDirectivesContext!);
    }

    /*
      The context of the render exists only once the render has ended: the effects and the components
      created in the constructor, in a field initializer or in onInit wait in a staging context,
      moved to the real one when the render has ended
    */
    this.onInit?.();
    const staging = this._context;
    this._context = render.call(this, nodeStrategy);
    nodeStrategy.end(this._root, this._context);
    staging.moveTo(this._context);

    const connectedHooks = this[CONNECTED_HOOKS];
    if (connectedHooks) {
      for (let i = 0; i < connectedHooks.length; i++) {
        connectedHooks[i]();
      }
    }

    // Bound once the queries are up to date, so a `@HostProperty` can read them
    _bindHost(this, this, this._context);
    this.afterRender?.();
    if (hydrating) {
      replayElementEvents(this);
      replayContractEvents();
    }
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
    return this.getRootNode() instanceof ShadowRoot && !this.hasAttribute(_SERVER_INPUTS_ATTRIBUTE)
      ? !isClaimed(this) || this.hasAttribute(_HYDRATE_ATTRIBUTE)
      : deferElementHydration(this, () => this.connectedCallback());
  }

  /**
   * Sets the inputs the server rendered the element with, when it is the root of a page rendered on the server, or a
   * component a static one renders: no template sets them in the browser, so `renderToString` writes them into the `data-xd-inputs` attribute of the
   * element. They are set by assigning their properties, as code outside Xaendar sets them, and the attribute is removed,
   * so that the element is the one the browser would render. Any other element has no such attribute.
   */
  private _restoreServerInputs(): void {
    const serialized = this.getAttribute(_SERVER_INPUTS_ATTRIBUTE);
    if (serialized === null) {
      return;
    }

    this.removeAttribute(_SERVER_INPUTS_ATTRIBUTE);
    const inputs = _parseState<object>(serialized);
    const names = keys(inputs);
    for (let i = 0; i < names.length; i++) {
      this[names[i]] = inputs[names[i]];
    }
  }

  /**
   * Optional lifecycle hook, invoked each time the element is removed from the DOM, before the effects
   * created via {@link effect} are disposed, the components created via {@link createComponent} are destroyed
   * and the rendered content is removed.
   */
  public onDestroy?(): void;
}
