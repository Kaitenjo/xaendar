/**
 * What a module path can continue with: a module of a directory, or a directory holding other ones.
 */
export type ModuleEntry = {
  /**
   * The name to write in the path: the file name without its extension, the directory name followed by a slash.
   */
  readonly name: string;
  /**
   * Whether the entry is a directory.
   */
  readonly isDirectory: boolean;
};
