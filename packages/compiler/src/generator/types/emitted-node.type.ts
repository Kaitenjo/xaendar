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
   * The identifiers of the variables of the template the node reads (see `IdentifierKind`), each one once, in the order they
   * are first read: `undefined` when it reads none.
   */
  variables?: number[];
  /**
   * The mappings of the columns of `expression` to the spans of the template they come from.
   */
  segments: LineMapping[];
};
