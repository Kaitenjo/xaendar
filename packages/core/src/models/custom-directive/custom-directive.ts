import type { Constructor, NoArgsVoidFunction } from '@xaendar/types';
import { DIRECTIVE_CONNECT, DIRECTIVE_DISCONNECT, SET_DIRECTIVE_ELEMENT, SET_DIRECTIVE_EVENTS } from '../../costants';
import { effect } from '../../signals/effect/effect';
import { EffectOptions } from '../../signals/types/effect-options.type';
import type { ComponentRef } from '../../types/create-component/component-ref.type';
import type { CreateComponentOptions } from '../../types/create-component/create-component-options.type';
import { _Context } from '../../utils/context/context.util';
import { _createComponent } from '../../utils/create-component/create-component.util';
import { _bindHost } from '../../utils/host-bindings/host-bindings.util';
import type { CustomElement } from '../custom-element/custom-element';

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
   * Optional lifecycle hook, invoked when the template runtime starts the directive,
   * once its inputs have been bound.
   */
  public onInit?(): void;

  /**
   * Starts the directive, invoked by the template runtime once its inputs have been bound.
   * Invokes `onInit`, if declared, then binds the attributes, the classes and the events of the element declared by
   * `@HostProperty` and `@HostEvent`.
   *
   * @param context - The context of the element the directive is applied to: the effects created via {@link effect}
   *   and the components created via {@link createComponent} are registered on it, so they are disposed when it is cleared.
   */
  public [DIRECTIVE_CONNECT](context: _Context): void {
    // The effects and the components created before the connection wait in the staging context: they move to the one of the element
    const staging = this._context;
    this._context = context;
    staging.moveTo(context);
    this.onInit?.();
    _bindHost(this, this._element, context);
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
   * Creates a component bound to the lifecycle of this directive and appends it to the target, binding its inputs and its
   * events, applying directives to it and appending the content to it, as a template does for the tag of the component:
   * the inputs are set before the element is mounted, so that its `onInit` reads them, the directives are applied and the
   * content appended once it is.
   *
   * The value of an input is given by a getter, run in an effect: the input follows the signals the getter reads. A group of
   * inputs or of events with a `condition` is bound only while the condition holds, as an `@if` written in the tag: as soon as
   * it doesn't, its inputs go back to their default value and its events are no longer listened to. A directive with a
   * `condition` is applied while the condition holds, and a new instance of it each time the condition holds again.
   *
   * The component is destroyed when this directive is disconnected, right after the effects created via {@link effect}, or
   * earlier by `destroy` of the returned reference. It can be created at any time: in the constructor, in a field initializer,
   * or in `onInit`. The creation is not tracked by an effect it is called in.
   *
   * @example
   * ```ts
   * public onInit(): void {
   *   this.createComponent(TooltipComponent, {
   *     target: document.body,
   *     properties: [{ text: () => this.text() }],
   *     content: [this.element.cloneNode(true)]
   *   });
   * }
   * ```
   *
   * @param component - The class of the component, decorated with `@WebComponent`.
   * @param options - The target the component is appended to, the groups of its inputs and of its events, the directives
   *   applied to it and its content.
   * @returns The element of the component, along with the function destroying it ahead of the disconnection.
   * @throws When the class is not decorated with `@WebComponent`, when an input is bound by more than one group, when a directive is not
   * a custom directive, or when it is already a host directive of the component.
   */
  public createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<NoInfer<Component>, Directives>): ComponentRef<Component> {
    return _createComponent(() => this._context, component, options);
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

  /**
   * Optional lifecycle hook, invoked when the context of the directive is destroyed,
   * before the effects created via {@link effect} are disposed and the components created via
   * {@link createComponent} are destroyed.
   */
  public onDestroy?(): void;
}
