/**
 * The triggers of a `@hydrate` or a `@defer`, or the ones following its `prefetch`, as the generator writes them for
 * the runtime (see `getTriggerProperties`).
 */
export type DescribedTriggers = {
  /**
   * The triggers but `when`, as written in an array literal.
   */
  triggers: string[];
  /**
   * The resolved expression of the `when` trigger, if any.
   */
  when?: string;
  /**
   * The constant listing the variables of the template the expression of `when` reads, if any.
   */
  whenReads?: string;
};
