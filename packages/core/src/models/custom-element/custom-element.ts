import { NoArgsVoidFunction } from '@xaendar/types';
import { CONNECTED_HOOKS, DISCONNECTED_HOOKS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { EffectOptions } from '../../signals/types/effect-options.type';
import { _Context } from '../../utils/context/context.util';
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
   * The active template execution context for this component instance,
   * holding all identifier bindings and registered cleanup functions.
   */
  private _context = new _Context(this, {} as unknown as _Context);
  /**
   * The root of the Web Component, where the content is rendered
   */
  private readonly _root = this.attachShadow({ mode: 'open' });
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
   * It can be called at any time, even in `onInit` before the first render.
   *
   * @param fn - The side-effectful function to run. Any Signal read inside it
   *   is tracked as a dependency.
   * @param options - Optional settings forwarded to the underlying effect.
   * @returns A function that disposes the effect ahead of the disconnection.
   */
  public effect(fn: NoArgsVoidFunction, options?: EffectOptions): NoArgsVoidFunction {
    const stop = effect(fn, options);
    let active = true;
    // Stops the effect at most once, whether it is disposed via the returned function or by the clearing of the context
    const dispose = () => {
      if (active) {
        active = false;
        stop();
      }
    };
    this._context.addUnlistener(dispose);

    return () => {
      this._context.removeUnlistener(dispose);
      dispose();
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
      throw new Error(`${this.constructor.name} does not seems to have a Render Function`);
    }

    const { render, styleSheet } = definition;
    if (styleSheet) {
      this._root.adoptedStyleSheets = [styleSheet];
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
    this[CONNECTED_HOOKS].forEach(hook => hook());
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
    this[DISCONNECTED_HOOKS].forEach(hook => hook());
  }
}
