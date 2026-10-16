import type { Function, VoidFunction } from '@xaendar/types';
import type { ComponentOrDirectiveMetadata } from './component-or-directive-metadata.type';
import type { ImportedSymbol } from './imported-symbol/imported-symbol.type';

export type CompilerCache = {
  /**
   * Retrieves cached metadata by key and populates the registry automatically if not present and path is provided.
   * To achieve this, the function must implement a loading mechanism that can fetch files and calls the api to
   * extract metadata and save them in cache
   * (e.g.)
   */
  getOrInsert: Function<[selector: string, path?: string | string[]], Promise<ComponentOrDirectiveMetadata>>;
  /**
   * Resolves what an `@import` specifier of a template imports: the metadata of the component or of the directive
   * it names, or, for any other export (and for a namespace import), the symbol it imports.
   *
   * @param imported - The name of the export (`'default'` for the default one, `'*'` for a namespace import).
   * @param local - The name the template imports it as, which names a component or directive exported as default.
   * @param baseDir - The directory of the template, which the path of the module is relative to.
   * @param path - The path of the module, as written in the `@import`.
   * @returns The metadata of the component or of the directive, or the imported symbol.
   * @throws If the module can't be resolved.
   */
  getImport: Function<[imported: string, local: string, baseDir: string, path: string], Promise<ComponentOrDirectiveMetadata | ImportedSymbol>>;
  /**
 * Store metadata in the cache.
 * @param selector - The selector for the component or directive
 * @param value - The metadata value to cache
 */
  set: VoidFunction<[selector: string, value: ComponentOrDirectiveMetadata]>;
}
