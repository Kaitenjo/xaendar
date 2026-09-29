import type { SourceFile } from 'typescript';

/**
 * Entry of the cache of the parsed ancestor files.
 */
export type CachedSourceFile = {
  /**
   * Modification time of the file when it was parsed, in milliseconds.
   */
  readonly modifiedTime: number;
  /**
   * Size of the file when it was parsed, in bytes.
   */
  readonly size: number;
  /**
   * The parsed file.
   */
  readonly sourceFile: SourceFile;
}
