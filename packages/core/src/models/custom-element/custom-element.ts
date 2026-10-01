import type { _Context } from '../../utils/context/context.util';
import { _collectEffects } from '../../utils/effect-scope/effect-scope.util';
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
  protected context!: _Context;

  /**
   * The root of the Web Component, where the content is rendered
   */
  private readonly _root: ShadowRoot;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  /**
   * Optional lifecycle hook, see {@link OnInit}.
   */
  public onInit?(): Array<VoidFunction> | void;

  /**
   * Optional lifecycle hook, see {@link OnDestroy}.
   */
  public onDestroy?(): void;

  /**
   * Called by the browser engine each time the element is inserted into the DOM.
   *
   * Adopts the stylesheet registered for this component class (see `_defineRender`), if any,
   * then triggers the initial render by invoking the compiler-generated render
   * function registered for it, which builds the Shadow DOM tree and sets up
   * reactive signal subscriptions. Then invokes `onInit`, if declared: the effects it creates
   * synchronously are disposed automatically on disconnection, along with the cleanup
   * functions it returns.
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

    this.context = render.call(this);

    const { result: unlistenFns, disposers } = _collectEffects(() => this.onInit?.());
    this.context.listen(...disposers, ...(unlistenFns ?? []));
  }

  /**
   * Called by the browser engine each time the element is removed from the DOM.
   *
   * Invokes `context.unlisten()` to dispose all active signal subscriptions,
   * detach event listeners, and remove tracked DOM nodes so the component
   * can be cleanly re-rendered if it is re-inserted.
   */
  private disconnectedCallback(): void {
    this.onDestroy?.();
    this.context.unlisten();
  }
}