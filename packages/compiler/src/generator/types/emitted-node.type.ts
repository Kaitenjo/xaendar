import type { LineMapping } from '../../type-checker/types/line-mapping.type';

/**
 * The text emitted for a node of an expression, with the mappings of its columns to the template.
 */
export type EmittedNode = {
  /**
   * The resolved text of the node.
   */
  expression: string;
  /**
   * Whether the node reads a signal.
   */
  reactive?: boolean;
  /**
   * The mappings of the columns of `expression` to the spans of the template they come from.
   */
  segments: LineMapping[];
};
