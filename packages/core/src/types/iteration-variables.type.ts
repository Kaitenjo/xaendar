import type { IterationVariable } from './iteration-variable.type';

/**
 * The variables the body of a `@for` reads, which each of its items creates as signals (see `_iterationVariables`): the
 * same for every item, so the compiled code declares them once, as a constant of the module of the template, which
 * `_for` and the function rendering an item read.
 *
 * N.B. Deliberate, to save memory: what is the same for every item of a `@for` lives in this object, created once per
 * template, instead of being passed to `_iterationVariables` as arguments (the item alias, an object of aliases, the list
 * of the variables) and captured by a closure updating the variables of each item, which cost several objects and a
 * closure per item. Do not pass them per item again.
 */
export type IterationVariables = {
  /**
   * The variables the body reads, named as the template writes them without aliases. The item is listed only when the
   * `@for` declares it.
   */
  readonly used: readonly IterationVariable[];
  /**
   * The name each variable of {@link used}, at the same index, is declared with in the context of the body: the alias of
   * the item, the alias of an implicit variable, or its own name.
   */
  readonly names: readonly string[];
};
