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
   * Allows accessing the members of subclasses through an index signature.
   */
  [key: string]: unknown
  /**
   * The active template execution context for this directive instance,
   * holding all identifier bindings and registered cleanup functions.
   * Until the connection it is a staging context, holding the effects created in the constructor or in a field
   * initializer: they are moved to the context of the element when the directive is connected.
   */
  private _context = new _Context({} as unknown as _Context);

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
    // The effects created before the connection wait in the staging context: they move to the one of the element
    const unlistenFns = this._context.getUnlistenFns();
    this._context = context;
    if (unlistenFns.length) {
      context.addUnlistener(...unlistenFns);
    }
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
   * It can be called at any time: in the constructor, in a field initializer, or in `onInit`.
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
