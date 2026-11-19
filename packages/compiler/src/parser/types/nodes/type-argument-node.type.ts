import type { Span } from '../../../types/span.type';

/**
 * A type argument a directive declares for its generic class, e.g. `Map<string, number>` in `@@list<Map<string, number>>(...)`.
 */
export type TypeArgumentNode = {
  /**
   * The type as written in the template.
   */
  text: string;
  /**
   * Span of the type, without the spaces around it.
   */
  span: Span;
};
