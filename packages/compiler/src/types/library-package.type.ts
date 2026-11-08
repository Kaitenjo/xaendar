/**
 * The package of a compiled library a component or a directive comes from.
 */
export type LibraryPackage = {
  /**
   * The name of the package (`@acme/ui`).
   */
  readonly name: string;
  /**
   * The absolute path of the root of the package, with forward slashes: the folder holding its `package.json` and its
   * manifest.
   */
  readonly root: string;
  /**
   * Whether the package holds the code of the server too (the `ssr` of its manifest).
   */
  readonly ssr: boolean;
};
