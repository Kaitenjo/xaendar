import type { ResolvedLibrary } from './resolved-library.type';

/**
 * The order the libraries of a workspace are built in, filled as it is found (see `buildLibraries`).
 */
export type LibraryOrder = {
  /**
   * The libraries of the workspace, by the name of their package.
   */
  readonly libraries: ReadonlyMap<string, ResolvedLibrary>;
  /**
   * The libraries of the workspace each library depends on, by name.
   */
  readonly dependencies: ReadonlyMap<string, readonly string[]>;
  /**
   * The libraries whose dependencies are being ordered, to find a library depending on itself.
   */
  readonly visiting: Set<string>;
  /**
   * The libraries ordered, each one after the ones it depends on, mapped to the libraries of the workspace it depends
   * on, directly or through another one.
   */
  readonly ordered: Map<string, string[]>;
};
