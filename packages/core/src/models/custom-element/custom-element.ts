import { NoArgsVoidFunction, VoidFunction } from '@xaendar/types';
import { effect } from '../../signals/effect/effect';
import { EffectOptions } from '../../signals/types/effect-options.type';
import type { _Context } from '../../utils/context/context.util';
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
  private _context!: _Context;
  /**
   * The root of the Web Component, where the content is rendered
   */
  private readonly _root = this.attachShadow({ mode: 'open' });
  /**
   * Disposers of the effects created via {@link effect}, invoked on disconnection.
   */
  private _unlistenFns = new Array<VoidFunction>();

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
    const dispose = effect(fn, options);
    this._unlistenFns.push(dispose);

    return () => {
      const index = this._unlistenFns.indexOf(dispose);
      if (index !== -1) {
        this._unlistenFns.splice(index, 1);
        dispose();
      }
    };
  }

  /**
   * Called by the browser engine each time the element is inserted into the DOM.
   *
   * Adopts the stylesheet registered for this component class (see `_defineRender`), if any,
   * and invokes `onInit`, if declared. Then triggers the render by invoking the compiler-generated render
   * function registered for it, which builds the Shadow DOM tree and sets up
   * reactive signal subscriptions, and finally invokes `afterRender`, if declared.
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

    this.onInit?.();
    this._context = render.call(this);
    this.afterRender?.();
  }

  /**
   * Called by the browser engine each time the element is removed from the DOM.
   *
   * Invokes `onDestroy`, if declared, and disposes the effects created via {@link effect}.
   * Then invokes `context.clear()`
   * to dispose all active signal subscriptions, detach event listeners, and remove
   * tracked DOM nodes so the component can be cleanly re-rendered if it is re-inserted.
   */
  private disconnectedCallback(): void {
    this.onDestroy?.();
    for (let i = 0; i < this._unlistenFns.length; i++) {
      this._unlistenFns[i]();
    }
    this._unlistenFns = [];
    this._context.clear();
  }
}
