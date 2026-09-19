import { _Context } from '../utils';

/**
 * Base class for all web components in the framework.
 *
 * Extends `HTMLElement` with Shadow DOM support and the lifecycle hooks
 * required for signal-based rendering. Concrete component classes should
 * extend this class and be decorated with `@WebComponent`.
 */
export class BaseWebComponent extends HTMLElement {
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
   * Initialises the component's Shadow DOM render tree.
   *
   * Overridden by the compiler-generated code injected via the `@WebComponent`
   * decorator pipeline. Returns an array of effect disposer functions that
   * should be called when the component is disconnected.
   *
   * @internal
   */
  private _render(): _Context {
    // Ignore, the actual render body is injected by the compiler 
    return {} as _Context;
  }

  /**
   * Called by the browser engine each time the element is inserted into the DOM.
   *
   * Triggers the initial render by calling `_render()`, which builds the
   * Shadow DOM tree and sets up reactive signal subscriptions.
   */
  private connectedCallback(): void {
    this.context = this._render();
  }

  /**
   * Called by the browser engine each time the element is removed from the DOM.
   *
   * Invokes `context.unlisten()` to dispose all active signal subscriptions,
   * detach event listeners, and remove tracked DOM nodes so the component
   * can be cleanly re-rendered if it is re-inserted.
   */
  private disconnectedCallback(): void {
    this.context.unlisten();
  }
}