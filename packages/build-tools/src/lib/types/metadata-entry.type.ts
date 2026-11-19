import { ComponentOrDirectiveMetadata } from '@xaendar/compiler';

/** 
 * Cache entry evicted by the registry's idle sweep once `lastAccessed` exceeds the TTL. 
 */
export type MetadataEntry = {
  /**
   * The metadata object associated with this cache entry.
   */
  metadata: ComponentOrDirectiveMetadata;
  /**
   * The timestamp of the last access to this cache entry. Used to determine if the entry is idle and should be evicted.
   */
  lastAccessed: number;
};