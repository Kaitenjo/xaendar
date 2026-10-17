import type { Span } from '../../../types/span.type';

/**
 * A template variable declared on an element, e.g. `#name` in `<input #name />`: it names the element, or the instance
 * of the component it is, in the expressions of its scope.
 */
export type TemplateVariableNode = {
  /**
   * The name of the variable.
   */
  name: string;
  /**
   * Span of the name, without the `#`.
   */
  nameSpan: Span;
  /**
   * Span of the whole variable, `#` included.
   */
  span: Span;
};
