import { VoidFunction } from '@xaendar/types';
import { DIRECTIVE_CONNECT } from '../../costants';

/**
 * Class that all directives registered via `@Directive` must extend.
 *
 * Holds the element the directive is applied to.
 * Directives are instantiated by the template runtime, which binds their
 * inputs and only then starts them (see {@link reactToChanges}).
 */
export abstract class CustomDirective {
  /**
   * Disposes of the directive by calling all unlisten functions.
   */
  [Symbol.dispose] = this._onDisconnectedCallback;

  /**
   * Array of functions to unlisten from events or other subscriptions.
   */
  private readonly unlistenFns = new Array<VoidFunction>();

  /**
   * @param element The element the directive is applied to.
   */
  constructor(protected readonly element: HTMLElement) { }

  /**
   * Method to define effects that should react to
   * changes in the directive's inputs.
   *
   * Invoked by the template runtime once the directive inputs have been bound,
   * so the directive fields are initialized and the effects read the bound
   * values since their first run.
   */
  abstract reactToChanges(): Array<VoidFunction> | undefined;

  /**
   * Dispatches an event on the element the directive is applied to.
   * Used by the `@Event` outputs declared by the directive.
   *
   * @param event The event to dispatch.
   * @returns `false` if the event is cancelable and a listener canceled it, `true` otherwise.
   */
  public dispatchEvent(event: Event): boolean {
    return this.element.dispatchEvent(event);
  }

  /**
   * Starts the directive by collecting the unlisten functions returned by {@link reactToChanges}.
   * Invoked by the template runtime only.
   */
  public [DIRECTIVE_CONNECT](): void {
    const unlistenFns = this.reactToChanges();
    if (unlistenFns) {
      this.unlistenFns.push(...unlistenFns);
    }
  }

  /**
   * Called when the directive is disconnected from the DOM.
   * Invokes all unlisten functions to clean up resources.
   */
  private _onDisconnectedCallback(): void {
    this.unlistenFns.forEach(fn => fn());
  }
}
