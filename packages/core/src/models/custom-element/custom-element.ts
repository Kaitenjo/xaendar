import { NoArgsVoidFunction } from '@xaendar/types';
import { CONNECTED_HOOKS, DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, DISCONNECTED_HOOKS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { EffectOptions } from '../../signals/types/effect-options.type';
import type { HostDirectives } from '../../types/web-component/host-directives.type';
import { _Context } from '../../utils/context/context.util';
import { _createHostDirectives } from '../../utils/host-directives/host-directives.util';
import { _getRender } from '../../utils/render-registry/render-registry.util';

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
   * Optional lifecycle hook, invoked each time the element is removed from the DOM, before the effects
   * created via {@link effect} are disposed and the rendered content is removed.
   */
  public onDestroy?(): void;

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
   * Called by the browser engine each time the element is inserted into the DOM.
   *
   * Adopts the stylesheet registered for this component class (see `_defineRender`), if any,
   * and invokes `onInit`, if declared. Then triggers the render by invoking the compiler-generated render
   * function registered for it, which builds the Shadow DOM tree and sets up
   * reactive signal subscriptions, then invokes the internal connected hooks
   * (e.g. the ones of the query signals) and finally `afterRender`, if declared.
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
      Effect called in the constructor and on init would raise an error
      due to context field being undefined until the onInit has finished its
      execution.

      We create a temporaney context on field initialize and move his unlistener functions
      to the real context when render has ended
    */
    this.onInit?.();
    const unwatchFns = this._context.getUnlistenFns();
    this._context = render.call(this);
    this._context.addUnlistener(...unwatchFns);
    for (let i = 0; i < this[CONNECTED_HOOKS].length; i++) {
      this[CONNECTED_HOOKS][i]();
    }
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
}
