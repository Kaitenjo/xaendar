import type { WhenTrigger } from './when-trigger.type';

/**
 * The element a trigger of a `@defer` watches in place of the ones of its `@placeholder`, named by an element ref: `more`
 * in `hover(more)`. Its span is the one of the name.
 */
export type TriggerTarget = Pick<WhenTrigger, 'expressionNode' | 'span'> & {
  /**
   * The name of the element ref.
   */
  name: string;
};
