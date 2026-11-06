/**
 * The trigger firing once a time has passed, as the compiler-generated render code describes it: `timer(2s)`.
 */
export type TimerTrigger = {
  /**
   * The kind of the trigger.
   */
  readonly kind: 'timer';
  /**
   * The time, in milliseconds.
   */
  readonly delay: number;
};
