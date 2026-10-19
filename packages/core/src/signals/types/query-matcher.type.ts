/**
 * How a query finds what it looks for, resolved from its target (see `toMatcher`): the elements matching a CSS
 * selector, mapped by `pick` to the values the query holds when they are not the elements themselves.
 */
export type QueryMatcher = {
  /**
   * The CSS selector of the candidate elements.
   */
  readonly selector: string;
  /**
   * What the query looks for, as the error messages write it: the selector, the class of a directive or `#ref`.
   */
  readonly description: string;
  /**
   * Maps the candidate elements, in order, to the values the query holds: the instances of a directive applied to them,
   * or the ones named by a ref. `undefined` when the query holds the candidate elements themselves.
   */
  readonly pick?: (elements: Element[]) => unknown[];
};
