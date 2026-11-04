/**
 * The render of a template, e.g. `@render row(item())`.
 */
export type LayoutRender = {
  /**
   * Discriminant identifying the atom as the render of a template.
   */
  readonly kind: 'render';
  /**
   * The name of the template.
   */
  readonly callee: string;
  /**
   * The arguments as written between the parentheses.
   */
  readonly args: string;
};
