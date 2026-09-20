import type { Function, VoidFunction } from '@xaendar/types';
import type { ComponentOrDirectiveMetadata } from './component-or-directive-metadata.type';

export type CompilerCache = {
  /**
   * Retrieve cached metadata by key.
   *
   * @param selector - The selector for the component or directive
   * @param path - The absolute file path of the component or directive
   * If metadata does not exists path can be used to load the file and extract them.
   * @returns The cached metadata, or undefined if not found
   */
  get: Function<[selector: string, path?: string | string[]], Promise<ComponentOrDirectiveMetadata>>;
  /**
 * Store metadata in the cache.
 *
 * @param selector - The selector for the component or directive
 * @param value - The metadata value to cache
 */
  set: VoidFunction<[selector: string, value: ComponentOrDirectiveMetadata]>;
}