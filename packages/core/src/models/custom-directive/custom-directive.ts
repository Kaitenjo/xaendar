import { VoidFunction } from '@xaendar/types';

/**
 * Class that all directives registered via `@Directive` must extend.
 *
 * Holds the element the directive is applied to.
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
  constructor(protected readonly element: HTMLElement) {
    const unlistenFns = this.reactToChanges();
    if (unlistenFns) {
      this.unlistenFns.push(...unlistenFns);
    }
  }

  /**
   * Method to define effects that should react to 
   * changes in the directive's inputs.
   */
  abstract reactToChanges(): Array<VoidFunction> | undefined;

  /**
   * Called when the directive is disconnected from the DOM.
   * Invokes all unlisten functions to clean up resources.
   */
  private _onDisconnectedCallback(): void {
    this.unlistenFns.forEach(fn => fn());
  }
}
