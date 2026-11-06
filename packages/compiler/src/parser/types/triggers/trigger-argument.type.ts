import type { Span } from '../../../types/span.type';

/**
 * An argument of a trigger, written between its parentheses: `more` in `hover(more)`.
 */
export type TriggerArgument = {
  /**
   * The argument, as written.
   */
  text: string;
  /**
   * Where the argument is written.
   */
  span: Span;
};
