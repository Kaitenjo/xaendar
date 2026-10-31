import type { ComponentOrDirectiveMetadata } from '@xaendar/compiler';

/**
 * The metadata extracted from a file, together with the text they were extracted from.
 */
export type MetadataEntry = {
  /**
   * The text of the file the metadata were extracted from.
   */
  readonly text: string;
  /**
   * The metadata of the components and directives declared in the file, keyed by class name.
   */
  readonly metadatas: ReadonlyMap<string, ComponentOrDirectiveMetadata>;
};
