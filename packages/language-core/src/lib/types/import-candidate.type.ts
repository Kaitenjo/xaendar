import type { ComponentOrDirectiveMetadata } from '@xaendar/compiler';

/**
 * A component or directive a template could import.
 */
export type ImportCandidate = {
  /**
   * The path of the file declaring it.
   */
  readonly fileName: string;
  /**
   * Its metadata.
   */
  readonly metadata: ComponentOrDirectiveMetadata;
};
