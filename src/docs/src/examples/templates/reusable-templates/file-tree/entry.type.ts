/**
 * A file, or a folder with the entries it holds.
 */
export type Entry = {
  /**
   * The name of the entry.
   */
  readonly name: string;
  /**
   * The entries of a folder, none for a file.
   */
  readonly children: Entry[];
};
