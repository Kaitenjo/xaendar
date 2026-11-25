/**
 * A library of a workspace, as the `libs` of its `xaendar.json` declares it, keyed by the name of its package
 * (`"libs": { "@acme/ui": { "root": "libraries/ui" } }`).
 */
export type XaendarLibraryConfig = {
  /**
   * The folder of the library, relative to the workspace (`libraries/ui`).
   */
  root: string;
  /**
   * The module exporting what the library publishes, relative to the folder of the library. Defaults to
   * `src/public-api.ts`.
   */
  entry?: string;
  /**
   * The folder the build of the library is written to, relative to the workspace. Defaults to `dist/<folder>`.
   */
  outDir?: string;
  /**
   * Whether the build of the library compiles its components for the server too, so that the applications rendering
   * their pages there render them. Without it, `@hydrate`, `@client` and the `ssr` option of `@WebComponent` are
   * errors in its templates and components. Defaults to `false`.
   */
  ssr?: boolean;
  /**
   * The patterns of the tag names of the custom elements of other libraries its templates use (`sl-*`).
   */
  customElements?: string[];
  /**
   * Whether its templates warn about the events their elements do not declare. Defaults to the one of the workspace.
   */
  strictEvents?: boolean;
};
