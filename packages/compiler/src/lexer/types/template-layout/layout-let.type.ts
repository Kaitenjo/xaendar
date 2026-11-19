/**
 * A `@let`, also called a template variable, e.g. `@let total = price() * quantity();`.
 */
export type LayoutLet = {
  /**
   * Discriminant identifying the atom as a `@let`.
   */
  readonly kind: 'let';
  /**
   * The name the `@let` declares.
   */
  readonly name: string;
  /**
   * The value as written between the `=` and the `;`.
   */
  readonly value: string;
};
