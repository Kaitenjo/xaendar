import type { BaseTrigger } from './base-trigger.type';

/**
 * The trigger firing when the browser is idle: `idle`, or `idle(500ms)`, which fires at the latest once the time has
 * passed.
 */
export type IdleTrigger = BaseTrigger<'idle'> & {
  /**
   * The longest time to wait, in milliseconds, if the trigger declares one.
   */
  timeout?: number;
};
