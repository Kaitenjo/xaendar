import type { Constructor, NoArgsVoidFunction } from '@xaendar/types';
import { CONNECTED_HOOKS, DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, DISCONNECTED_HOOKS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { EffectOptions } from '../../signals/types/effect-options.type';
import type { ComponentRef } from '../../types/create-component/component-ref.type';
import type { CreateComponentOptions } from '../../types/create-component/create-component-options.type';
import type { HostDirectives } from '../../types/web-component/host-directives.type';
import { _Context } from '../../utils/context/context.util';
import { _createComponent } from '../../utils/create-component/create-component.util';
import { _bindHost } from '../../utils/host-bindings/host-bindings.util';
import { _createHostDirectives } from '../../utils/host-directives/host-directives.util';
import { _getRender } from '../../utils/render-registry/render-registry.util';
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
  public readonly [CONNECTED_HOOKS] = new Array<NoArgsVoidFunction>();
  /**
   * Internal callbacks invoked by the runtime each time the element is removed from the DOM,
   * after the context is cleared. They are never cleared, so they survive the reconnections.
   */
  public readonly [DISCONNECTED_HOOKS] = new Array<NoArgsVoidFunction>();
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
  private _context = new _Context({} as unknown as _Context);
  /**
   * The context the host directives are connected to: it lives from the connection to the disconnection of the element,
   * disposing the effects of the directives.
   */
  private readonly _hostDirectivesContext = new _Context({} as unknown as _Context);
  /**
   * The root of the Web Component, where the content is rendered
   */
  private readonly _root = this.attachShadow({ mode: 'open' });

  /**
   * Creates the element and the host directives declared by its `@WebComponent`, applied to it.
   *
   * @throws When a host directive is declared twice or exposes an input or an event it does not declare.
   */
  constructor() {
    super();
    this.hostDirectives = _createHostDirectives(this);
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
    const stop = effect(fn, options);
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
  public createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<NoInfer<Component>, Directives>): ComponentRef<Component> {
    return _createComponent(() => this._context, component, options);
  }

  /**
   * Called by the browser engine each time the element is inserted into the DOM.
   *
   * Adopts the stylesheet registered for this component class (see `_defineRender`), if any,
   * and invokes `onInit`, if declared. Then triggers the render by invoking the compiler-generated render
   * function registered for it, which builds the Shadow DOM tree and sets up
   * reactive signal subscriptions, then invokes the internal connected hooks
   * (e.g. the ones of the query signals), binds the attributes, the classes and the events declared by `@HostProperty`
   * and `@HostEvent`, and finally invokes `afterRender`, if declared.
   *
   * @throws When no render function is registered for this component class.
   */
  private connectedCallback(): void {
    const definition = _getRender(this.constructor);
    if (!definition) {
      throw new Error(`${this.constructor.name} does not seem to have a Render Function`);
    }

    const { render, styleSheet } = definition;
    if (styleSheet) {
      this._root.adoptedStyleSheets = [styleSheet];
    }

    // The host directives are started before the component, so its `onInit` finds them ready
    for (const directive of this.hostDirectives.values()) {
      directive[DIRECTIVE_CONNECT](this._hostDirectivesContext);
    }

    /*
      The context of the render exists only once the render has ended: the effects and the components
      created in the constructor, in a field initializer or in onInit wait in a staging context,
      moved to the real one when the render has ended
    */
    this.onInit?.();
    const staging = this._context;
    this._context = render.call(this);
    staging.moveTo(this._context);
    for (let i = 0; i < this[CONNECTED_HOOKS].length; i++) {
      this[CONNECTED_HOOKS][i]();
    }
    // Bound once the queries are up to date, so a `@HostProperty` can read them
    _bindHost(this, this, this._context);
    this.afterRender?.();
  }

  /**
   * Called by the browser engine each time the element is removed from the DOM.
   *
   * Invokes `onDestroy`, if declared, then invokes `context.clear()` to dispose the effects
   * created via {@link effect} and all the other active signal subscriptions, detach event listeners,
   * and remove tracked DOM nodes so the component can be cleanly re-rendered if it is re-inserted,
   * and finally invokes the internal disconnected hooks.
   */
  private disconnectedCallback(): void {
    this.onDestroy?.();
    this._context.clear();
    // The host directives are stopped after the component, then their effects are disposed
    for (const directive of this.hostDirectives.values()) {
      directive[DIRECTIVE_DISCONNECT]();
    }
    this._hostDirectivesContext.clear();
    for (let i = 0; i < this[DISCONNECTED_HOOKS].length; i++) {
      this[DISCONNECTED_HOOKS][i]();
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
   * Optional lifecycle hook, invoked each time the element is removed from the DOM, before the effects
   * created via {@link effect} are disposed, the components created via {@link createComponent} are destroyed
   * and the rendered content is removed.
   */
  public onDestroy?(): void;
}
