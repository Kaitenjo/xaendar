import type { IterationVariable } from './iteration-variable.type';

/**
 * The variables the body of a `@for` reads, which each of its items declares as values (see `_iterationVariables`): the
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
   * `@for` declares it. The one at `i` is held by the slot `HEADER + i` of the context of the body.
   */
  readonly used: readonly IterationVariable[];
  /**
   * The identifier of each variable of {@link used}, at the same index, unique in the template, which a refresh of the
   * context of the body names it by.
   */
  readonly ids: readonly number[];
};
