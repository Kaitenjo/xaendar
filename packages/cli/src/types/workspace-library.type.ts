/**
 * A library a command adds to a workspace.
 */
export type WorkspaceLibrary = {
  /**
   * The name of its package, which the projects import it by (`@acme/ui`), and its key in the `libs` of `xaendar.json`.
   */
  readonly name: string;
  /**
   * The name of its folder under `libraries`: the name of the package without its scope (`ui`).
   */
  readonly folder: string;
  /**
   * Whether its build compiles its components for the server too.
   */
  readonly ssr: boolean;
};
