/**
 * The connection of the element of a component a template mounts inside a `@try`: the error of the code of the
 * component, which the browser would report instead of throwing it where the element is inserted.
 */
export type ChildConnection = {
  /**
   * The error thrown while the component was connected, wrapped so that `undefined` thrown can be told from no error.
   */
  failure: { readonly error: unknown } | undefined;
};
