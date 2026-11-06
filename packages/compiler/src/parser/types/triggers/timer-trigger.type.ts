import type { BaseTrigger } from './base-trigger.type';

/**
 * The trigger firing once a time has passed: `timer(2s)`.
 */
export type TimerTrigger = BaseTrigger<'timer'> & {
  /**
   * The time, in milliseconds.
   */
  delay: number;
};
