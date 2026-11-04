/**
 * An element ref naming an element, `#name`.
 */
export type LayoutElementRef = {
  /**
   * Discriminant identifying the item as an element ref.
   */
  readonly kind: 'ref';
  /**
   * The name of the ref.
   */
  readonly name: string;
};
