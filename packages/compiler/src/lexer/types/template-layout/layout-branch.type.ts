/**
 * A branch of a block: `@if (condition) { body }`, `@else { body }`, `@case (condition) { body }`.
 */
export type LayoutBranch<Body> = {
  /**
   * The keyword after the `@`: `if`, `else if`, `else`, `for`, `case`, `default`, `hydrate`, `client`,
   * `placeholder`, `try`, `catch`, `defer`, `loading` or `error`.
   */
  readonly keyword: string;
  /**
   * The condition as written between the parentheses, `undefined` for a branch without one.
   */
  readonly condition?: string;
  /**
   * The content between the braces, `undefined` for a `@case` stacked on the next one.
   */
  readonly body?: Body;
};
