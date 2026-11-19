/**
 * What the expressions of the `class` or of the `style` of an element read, collected while their functions are
 * declared: whether the attribute is written once or as a binding, and with which variables of the template.
 */
export type StylingExpressions = {
  /**
   * How many expressions the attribute has.
   */
  count: number;
  /**
   * Whether every expression reads no name.
   */
  constant: boolean;
  /**
   * The identifiers of the variables of the template the expressions read, `undefined` for none.
   */
  variables: readonly number[] | undefined;
};
