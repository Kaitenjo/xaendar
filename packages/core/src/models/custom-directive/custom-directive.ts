import { NoArgsVoidFunction } from '@xaendar/types';
import { DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, SET_DIRECTIVE_ELEMENT, SET_DIRECTIVE_EVENTS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { EffectOptions } from '../../signals/types/effect-options.type';
import { _Context } from '../../utils/context/context.util';

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
export abstract class CustomDirective<T extends Element = Element> {
  /**
   * Notation to accesso through index signature
   */
  [key: string]: unknown
  /**
   * The active template execution context for this directive instance,
   * holding all identifier bindings and registered cleanup functions.
   */
  private _context!: _Context;

  /**
   * Reference to the HTML Element the directive is applied
   */
  private _element!: T

  /**
   * The events a host directive exposes, as a map from the name of the event the directive dispatches to the name it is
   * dispatched with on the host. `undefined` when the directive is applied from a template, which dispatches all of them.
   */
  private _exposedEvents?: Map<string, string>;

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
   * Sets the events the directive exposes, invoked by the component the directive is a host directive of,
   * before `DIRECTIVE_CONNECT`.
   *
   * @param events - The map from the name of the event the directive dispatches to the name it is dispatched with
   *   on the component. The events it does not hold are not dispatched.
   */
  public set [SET_DIRECTIVE_EVENTS](events: Map<string, string>) {
    this._exposedEvents = events;
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
   *
   * @param context - The context of the element the directive is applied to: the effects created
   *   via {@link effect} are registered on it, so they are disposed when it is cleared.
   */
  public [DIRECTIVE_CONNECT](context: _Context): void {
    this._context = context;
    this.onInit?.();
  }

  /**
   * Disconnects the directive, invoked by the template runtime when its context is destroyed,
   * before the effects created via {@link effect} are disposed by the clearing of the context.
   * Invokes `onDestroy`, if declared.
   */
  public [DIRECTIVE_DISCONNECT](): void {
    this.onDestroy?.();
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
   * Dispatches an event on the element the directive is applied to.
   * Used by the `@Event` outputs declared by the directive.
   *
   * A host directive dispatches only the events its component exposes, under the name they are exposed with.
   *
   * @param event The event to dispatch.
   * @returns `false` if the event is cancelable and a listener canceled it, `true` otherwise.
   */
  public dispatchEvent(event: CustomEvent): boolean {
    // Only a directive applied from a template has no map: a host directive with an empty one exposes nothing
    if (this._exposedEvents === undefined) {
      return this._element.dispatchEvent(event);
    }

    const name = this._exposedEvents.get(event.type);
    if (!name) {
      return true;
    }

    return this._element.dispatchEvent(name === event.type ? event : new CustomEvent(name, {
      detail: event.detail,
      bubbles: event.bubbles,
      cancelable: event.cancelable,
      composed: event.composed
    }));
  }
}
