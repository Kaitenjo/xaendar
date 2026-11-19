/**
 * The trigger `idle` written with the longest time to wait, as the compiler-generated render code describes it:
 * `idle(500ms)`.
 */
export type IdleTrigger = {
  /**
   * The kind of the trigger.
   */
  readonly kind: 'idle';
  /**
   * The longest time to wait for the browser to be idle, in milliseconds.
   */
  readonly timeout: number;
};
