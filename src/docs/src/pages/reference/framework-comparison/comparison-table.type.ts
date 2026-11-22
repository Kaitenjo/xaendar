import type { ComparisonRow } from './comparison-row.type';

/**
 * A table of the framework comparison.
 */
export type ComparisonTable = {
  /**
   * The key of the title of the table in the messages.
   */
  readonly title: string;
  /**
   * The rows of the table, one per measure.
   */
  readonly rows: readonly ComparisonRow[];
};
