import type { Span } from '../../../types/span.type';

/**
 * An element ref declared on an element, e.g. `#name` in `<input #name />`: it names the element, or the instance
 * of the component it is, in the expressions of its scope.
 */
export type ElementRefNode = {
  /**
   * The name of the ref.
   */
  name: string;
  /**
   * Span of the name, without the `#`.
   */
  nameSpan: Span;
  /**
   * Span of the whole ref, `#` included.
   */
  span: Span;
};
