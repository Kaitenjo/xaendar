/**
 * How long the CSS animations and transitions of an element run, in milliseconds (see `readAnimationTimes`).
 */
export type AnimationTimes = {
  /**
   * The longest run of an animation (all of its iterations) or of a transition, without its delay: the `elapsedTime`
   * of the event ending it.
   */
  readonly duration: number;
  /**
   * The time the last animation or transition ends at, from now, delays included: `0` when none runs.
   */
  readonly end: number;
};
