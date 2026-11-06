import type { ElementTrigger } from './element-trigger.type';
import type { BaseTrigger } from './base-trigger.type';
import type { TriggerOptions } from './trigger-options.type';

/**
 * The trigger firing when one of the elements it watches enters the viewport: the elements of the block, or the one an
 * element ref names, observed with the options it declares: `visible(more, { rootMargin: '200px' })`.
 */
export type VisibleTrigger = BaseTrigger<'visible'> & Pick<ElementTrigger, 'target'> & {
  /**
   * The options of the `IntersectionObserver`, if the trigger declares them.
   */
  options?: TriggerOptions;
};
