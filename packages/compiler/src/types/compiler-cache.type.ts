import type { Function, VoidFunction } from '@xaendar/types';
import type { ComponentOrDirectiveMetadata } from './component-or-directive-metadata.type';

export type CompilerCache = {
  /**
   * Retrieves cached metadata by key and populates the registry automatically if not present and path is provided.
   * To achieve this, the function must implement a loading mechanism that can fetch files and calls the api to
   * extract metadata and save them in cache
   * 
   * (e.g.)
   */
  getOrInsert: Function<[selector: string, path?: string | string[]], Promise<ComponentOrDirectiveMetadata>>;
  /**
 * Store metadata in the cache.
 *
 * @param selector - The selector for the component or directive
 * @param value - The metadata value to cache
 */
  set: VoidFunction<[selector: string, value: ComponentOrDirectiveMetadata]>;
}