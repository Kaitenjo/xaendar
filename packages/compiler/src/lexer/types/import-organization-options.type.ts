/**
 * What {@link organizeImports} does besides writing the statements in a regular form.
 */
export type ImportOrganizationOptions = {
  /**
   * The specifiers to remove, written as {@link toImportKey} writes them.
   */
  readonly unused?: ReadonlySet<string>;
  /**
   * Whether to merge the statements importing from the same module and sort the statements by path and the
   * specifiers by name, bare module names before relative paths, ignoring the case.
   */
  readonly sort?: boolean;
};
