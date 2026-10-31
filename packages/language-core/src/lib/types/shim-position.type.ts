import type { SourceFile } from 'typescript';

/**
 * A position of the shim of a template.
 */
export type ShimPosition = {
  /**
   * The shim.
   */
  readonly shimFile: SourceFile;
  /**
   * The position in the shim.
   */
  readonly position: number;
};
