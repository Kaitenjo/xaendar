/**
 * A row of a table of the framework comparison: one measure, with its value for each framework.
 */
export type ComparisonRow = {
  /**
   * The key of the name of the measure in the messages.
   */
  readonly label: string;
  /**
   * The values of the measure, formatted in the current language, in the order of the frameworks.
   */
  readonly values: readonly string[];
};
