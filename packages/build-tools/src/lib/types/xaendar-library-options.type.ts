/**
 * A library of the workspace the project belongs to, which the project imports from its sources: its components are
 * compiled with the ones of the project, with the options of the library.
 */
export type XaendarLibraryOptions = {
  /**
   * The name of the package of the library, which the code and the templates import it by (`@acme/ui`): it leads to
   * its entry, and `@acme/ui/<path>` to the files beside the entry.
   */
  readonly name: string;
  /**
   * The folder of the library, absolute or relative to the directory Vite is launched from.
   */
  readonly root: string;
  /**
   * The module exporting what the library publishes, absolute or relative to its folder. Defaults to
   * `src/public-api.ts`.
   */
  readonly entry?: string;
  /**
   * Whether the library renders on the server. Without it, `@hydrate`, `@client` and the `ssr` option of
   * `@WebComponent` are errors in its templates and components, and the server renders its components as the ones
   * declaring `ssr: { render: false }`, as an application rendering on the server does with the build of the library.
   * Defaults to `false`.
   */
  readonly ssr?: boolean;
  /**
   * The patterns of the tag names of the custom elements of other libraries its templates use (`sl-*`), in place of
   * the ones of the project. Defaults to none.
   */
  readonly customElements?: readonly string[];
};
