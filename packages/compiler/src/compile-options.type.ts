import { CompilerCache } from './types/compiler-cache.type';

/**
 * Configuration options for the compile function.
 *
 * Allows customizing the compilation behavior of Xaendar DSL templates
 * through optional caching and signal extraction.
 *
 * @example
 * // Compile with type-checking only
 * const typeCheckResult = await compile(templateSource, {
 *   baseDir: '/path/to/templates'
 * });
 *
 * @example
 * // Compile with JavaScript generation and signals
 * const javascript = await compile(templateSource, {
 *   signals: ['count', 'isActive']
 * });
 *
 * @example
 * // Compile with caching
 * const metadataCache = new Map();
 * const result = await compile(templateSource, {
 *   baseDir: '/path/to/templates',
 *   signals: ['count'],
 *   cache: {
 *     get: (key) => metadataCache.get(key),
 *     set: (key, value) => metadataCache.set(key, value)
 *   }
 * });
 */
export type CompileOptions = {
  /**
   * Base directory for resolving component imports and template paths.
   *
   * Required when performing type-checking compilation. Used to resolve
   * relative import paths to absolute file paths.
   */
  baseDir?: string;
  /**
   * Array of signal member names extracted from the component class.
   *
   * Used during code generation to properly inject reactive signal bindings
   * and updates into the generated render function.
   *
   * Required when generating JavaScript output. Ignored if undefined.
   */
  signals?: string[];
  /**
   * Optional caching layer for component and directive metadata.
   *
   * Improves compilation performance by caching extracted metadata,
   * avoiding redundant parsing and extraction of imported components.
   */
  cache: CompilerCache
}
