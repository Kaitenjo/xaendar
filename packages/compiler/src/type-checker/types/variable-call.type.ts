import type { Span } from '../../types/span.type';

/**
 * The call of a variable of the template in one of its expressions, e.g. `row()` of the item `row` of a `@for`.
 */
export type VariableCall = {
  /**
   * The name of the variable.
   */
  readonly name: string;
  /**
   * The span of the name, where TypeScript reports the call of a value that is not a function.
   */
  readonly span: Span;
};
