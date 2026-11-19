/**
 * A library of a workspace, its paths resolved.
 */
export type ResolvedLibrary = {
  /**
   * The name of its package, its key in the `libs` of `xaendar.json`.
   */
  readonly name: string;
  /**
   * The absolute path of its folder.
   */
  readonly root: string;
  /**
   * The absolute path of the module exporting what it publishes.
   */
  readonly entry: string;
};
