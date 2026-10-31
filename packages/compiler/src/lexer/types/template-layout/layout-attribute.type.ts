/**
 * An attribute or a property of a component or directive, `name` or `name="value"`.
 */
export type LayoutAttribute = {
  /**
   * Discriminant identifying the item as an attribute.
   */
  readonly kind: 'attribute';
  /**
   * The name of the attribute.
   */
  readonly name: string;
  /**
   * The value as written between the quotes, `undefined` for an attribute declared without one.
   */
  readonly value?: string;
};
