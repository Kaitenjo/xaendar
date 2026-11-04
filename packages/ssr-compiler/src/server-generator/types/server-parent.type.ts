/**
 * Where the nodes processed by the server generator are rendered.
 */
export type ServerParent = {
  /**
   * The identifier the names of the functions written for the nodes start with, unique in the module: the names are the
   * ones the client generator gives to the functions rendering the same nodes.
   */
  readonly id: string;
  /**
   * The tag name of the element the nodes are rendered into: its text is escaped as the element requires it.
   * `undefined` for the root of the component and for the content of a template, rendered where a `@render` is.
   */
  readonly tag?: string;
};
