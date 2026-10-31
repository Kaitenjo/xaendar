import type { TypeCheckResult } from './type-checker-result.type';

/**
 * The result of type-checking a template without stopping at the first error (see `TypeChecker.generateTolerant`).
 */
export type TypeCheckTolerantResult = TypeCheckResult & {
  /**
   * The errors of the nodes that failed type-checking, in template order: a `TemplateError` when the error points to a
   * part of the template. The shim leaves out what those nodes would have checked.
   */
  errors: readonly Error[];
};
