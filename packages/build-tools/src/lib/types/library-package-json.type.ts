/**
 * The `package.json` of a library: the fields its build reads, the other ones copied into the package as they are.
 */
export type LibraryPackageJson = {
  /**
   * The name of the package.
   */
  name?: string;
  /**
   * The version of the package.
   */
  version?: string;
  /**
   * The packages it depends on, left out of its build.
   */
  dependencies?: Record<string, string>;
  /**
   * The packages the application provides, left out of its build.
   */
  peerDependencies?: Record<string, string>;
  /**
   * The options of the peer dependencies.
   */
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  /**
   * The other fields.
   */
  [field: string]: unknown;
};
