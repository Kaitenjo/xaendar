/**
 * The events telling that a CSS animation or transition of an element ended, or was cancelled.
 */
const END_EVENTS: readonly string[] = ['animationend', 'animationcancel', 'transitionend', 'transitioncancel'];

/**
 * The time, in milliseconds, waited past the end of the CSS animations and transitions of an element before giving up
 * on their events: an animation removed, or one whose events never fire, does not keep the element waiting.
 */
export const END_MARGIN = 100;

/**
 * Waits for the CSS animations and transitions of an element to end: listens to their events on the element itself,
 * passing over the ones of its descendants, which bubble, and settles once the longest one ends, one is cancelled, or
 * their time has passed with {@link END_MARGIN}.
 */
export class AnimationEnd {
  /**
   * The element.
   */
  private readonly _element: Element;
  /**
   * The longest run of an animation or of a transition of the element, without its delay, in milliseconds: the
   * `elapsedTime` of the event ending it.
   */
  private readonly _duration: number;
  /**
   * Settles the wait.
   */
  private readonly _resolve: () => void;
  /**
   * The timer settling the wait once the time of the animations has passed.
   */
  private readonly _timer: ReturnType<typeof setTimeout>;

  /**
   * Starts waiting.
   *
   * @param element - The element.
   * @param duration - The longest run of an animation or of a transition of the element, without its delay, in
   *   milliseconds.
   * @param end - The time the last animation or transition ends at, from now, delays included, in milliseconds.
   * @param resolve - Settles the wait.
   */
  public constructor(element: Element, duration: number, end: number, resolve: () => void) {
    this._element = element;
    this._duration = duration;
    this._resolve = resolve;
    for (let i = 0; i < END_EVENTS.length; i++) {
      element.addEventListener(END_EVENTS[i], this);
    }

    this._timer = setTimeout(() => this.finish(), end + END_MARGIN);
  }

  /**
   * Settles the wait on the end of the longest animation or transition of the element, or on the cancellation of one.
   *
   * @param event - The event.
   */
  public handleEvent(event: Event): void {
    if (event.target !== this._element) {
      return;
    }

    // The animations and the transitions of different lengths end one by one: the longest one ends last
    if (event.type.endsWith('cancel') || (event as AnimationEvent | TransitionEvent).elapsedTime * 1000 >= this._duration - 1) {
      this.finish();
    }
  }

  /**
   * Stops listening and settles the wait.
   */
  public finish(): void {
    clearTimeout(this._timer);
    for (let i = 0; i < END_EVENTS.length; i++) {
      this._element.removeEventListener(END_EVENTS[i], this);
    }

    this._resolve();
  }
}
