import { NoArgsVoidFunction, VoidFunction } from '@xaendar/types';
import { DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, SET_DIRECTIVE_ELEMENT } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { EffectOptions } from '../../signals/types/effect-options.type';

/**
 * Base class for custom directives: behaviors applied to an existing HTML element
 * from a template, without owning its content.
 *
 * The template runtime starts the directive via `DIRECTIVE_CONNECT` once its inputs
 * have been bound and tears it down via `DIRECTIVE_DISCONNECT` when its context is
 * destroyed. Subclasses may declare the optional `onInit` and `onDestroy` hooks.
 * Effects created via {@link CustomDirective.effect} are disposed automatically
 * on disconnection.
 */
export abstract class CustomDirective<T extends HTMLElement = HTMLElement> {
  /**
   * Disposers of the effects created via {@link effect}, invoked on disconnection.
   */
  private _unlistenFns = new Array<VoidFunction>();

  /**
   * Reference to the HTML Element the directive is applied
   */
  private _element!: T

  /**
   * Sets the HTML element the directive is applied to, invoked by the
   * template runtime before `DIRECTIVE_CONNECT`.
   *
   * @param element - The element the directive is applied to.
   */
  public set [SET_DIRECTIVE_ELEMENT](element: T) {
    this._element = element;
  }

  /**
   * Gets the HTML element the directive is applied on
   *
   * @returns element - The element the directive is applied to.
   */
  public get element(): T {
    return this._element;
  }
  
  /**
   * Starts the directive, invoked by the template runtime once its inputs have been bound.
   * Invokes `onInit`, if declared.
   */
  public [DIRECTIVE_CONNECT](): void {
    this.onInit?.();
  }

  /**
   * Disconnects the directive, invoked by the template runtime when its context is destroyed.
   * Invokes `onDestroy`, if declared, then disposes the effects created via {@link effect}.
   */
  public [DIRECTIVE_DISCONNECT](): void {
    this.onDestroy?.();
    for (let i = 0; i < this._unlistenFns.length; i++) {
      this._unlistenFns[i]();
    }
    this._unlistenFns = [];
  }

  /**
   * Optional lifecycle hook, invoked when the template runtime starts the directive,
   * once its inputs have been bound.
   */
  public onInit?(): void;

  /**
   * Optional lifecycle hook, invoked when the context of the directive is destroyed,
   * before the effects created via {@link effect} are disposed.
   */
  public onDestroy?(): void;

  /**
   * Creates a signal effect bound to the lifecycle of this directive:
   * it is disposed automatically when the directive is disconnected.
   *
   * @param fn - The side-effectful function to run. Any Signal read inside it
   *   is tracked as a dependency.
   * @param options - Optional settings forwarded to the underlying effect.
   * @returns A function that disposes the effect ahead of the disconnection
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
   * Dispatches an event on the element the directive is applied to.
   * Used by the `@Event` outputs declared by the directive.
   *
   * @param event The event to dispatch.
   * @returns `false` if the event is cancelable and a listener canceled it, `true` otherwise.
   */
  public dispatchEvent(event: Event): boolean {
    return this._element.dispatchEvent(event);
  }
}
