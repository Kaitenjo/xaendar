/**
 * How `lexExpressionText` reads a text.
 */
export type ExpressionTextOptions = {
  /**
   * Whether the text holds types, whose type arguments (`<…>`) are groups.
   */
  readonly types?: boolean;
  /**
   * Whether a cast closing the text ends it before its `as`, written between whitespace outside of any group and
   * literal, e.g. `value()` in `{ value() as string }`.
   */
  readonly cast?: boolean;
};
