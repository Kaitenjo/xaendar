import type { BaseTrigger } from './base-trigger.type';
import type { TriggerTarget } from './trigger-target.type';

/**
 * A trigger firing at an event on the elements it watches: `interaction` at the first event, `hover` when the pointer
 * moves over one of them or the focus enters it. It watches the elements of the block, or the one an element ref names:
 * `hover(more)`.
 */
export type ElementTrigger = BaseTrigger<'interaction' | 'hover'> & {
  /**
   * The element ref naming the element watched, if the trigger declares one.
   */
  target?: TriggerTarget;
};
