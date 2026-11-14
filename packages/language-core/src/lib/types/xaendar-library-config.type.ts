/**
 * What the language service reads of a library of the workspace, in the `libs` of `xaendar.json`.
 */
export type XaendarLibraryConfig = {
  /**
   * The folder of the library, relative to the workspace.
   */
  readonly root: string;
  /**
   * Whether the library renders on the server: without it, `@hydrate`, `@client` and the `ssr` option of
   * `@WebComponent` are errors in its templates and components.
   */
  readonly ssr?: boolean;
  /**
   * The patterns of the tag names of the custom elements of other libraries its templates use, in place of the ones of
   * the project.
   */
  readonly customElements?: readonly string[];
  /**
   * Whether its templates warn about the events their elements do not declare, in place of the option of the project.
   */
  readonly strictEvents?: boolean;
};
