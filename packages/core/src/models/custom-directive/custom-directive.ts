import { VoidFunction } from '@xaendar/types';
import { DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT } from '../../costants';
import { _collectEffects } from '../../utils/effect-scope/effect-scope.util';

/**
 * Class that all directives registered via `@Directive` must extend.
 *
 * Holds the element the directive is applied to.
 * Directives are instantiated by the template runtime, which binds their
 * inputs and only then starts them (see {@link onInit}).
 */
export abstract class Directive {
  /**
   * Array of functions to unlisten from events or other subscriptions.
   */
  protected readonly unlistenFns = new Array<VoidFunction>();

}

export abstract class CustomDirective extends Directive {
  /**
   * @param element The element the directive is applied to.
   */
  constructor(protected readonly element: HTMLElement) {
    super();
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
   * Starts the directive, invoked by the template runtime once its inputs have been bound.
   * Invokes `onInit`, if declared, and keeps the cleanup functions it returns,
   * along with the disposers of the effects it creates synchronously.
   */
  public [DIRECTIVE_CONNECT](): void {
    const { result: unlistenFns, disposers } = _collectEffects(() => this.onInit?.());
    this.unlistenFns.push(...disposers, ...(unlistenFns ?? []));
  }

  /**
   * Disconnects the directive, invoked by the template runtime when its context is destroyed.
   * Runs the cleanup functions returned by `onInit`, then invokes `onDestroy`, if declared.
   */
  public [DIRECTIVE_DISCONNECT](): void {
    for (let i = 0; i < this.unlistenFns.length; i++) {
      this.unlistenFns[i]();
    }

    this.onDestroy?.();
  }

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
}
