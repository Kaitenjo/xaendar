/**
 * The options of an event emitted by an `@Event` output: the subset of {@link EventInit} that configures
 * how the `CustomEvent` is dispatched. The detail is not part of them, since it is passed separately when emitting.
 */
export class EventOptions implements EventInit {
  /**
   * Whether the event bubbles up through the ancestors of the element it is dispatched on.
   */
  private readonly _bubbles?: boolean;
  /**
   * Whether the event can be canceled with `preventDefault()`.
   */
  private readonly _cancelable?: boolean;
  /**
   * Whether the event crosses the shadow root boundary, reaching the light DOM of the host.
   */
  private readonly _composed?: boolean;

  /**
 * Whether the event bubbles up through the ancestors of the element it is dispatched on.
 */
  public get bubbles(): boolean | undefined {
    return this._bubbles;
  }

  /**
   * Whether the event can be canceled with `preventDefault()`.
   */
  public get cancelable(): boolean | undefined {
    return this._cancelable;
  }

  /**
   * Whether the event crosses the shadow root boundary, reaching the light DOM of the host.
   */
  public get composed(): boolean | undefined {
    return this._composed;
  }

  /**
   * Creates the options of an emission.
   *
   * @param options - The options to set.
   */
  constructor(options: Partial<EventOptions>) {
    this._bubbles = options.bubbles;
    this._cancelable = options.cancelable;
    this._composed = options.composed;
  }
}
