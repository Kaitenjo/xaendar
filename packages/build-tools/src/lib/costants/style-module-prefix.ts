/**
 * Prefix of the import specifier of a compiled style module (see `createStyleModuleSpecifier`).
 *
 * Unlike template modules, the stylesheet path is carried in the query rather than in the path
 * of the id: an id ending in `.css` (optionally followed by a query) would be picked up by the
 * Vite CSS plugin, which would try to process the generated JavaScript as a stylesheet.
 */
export const STYLE_MODULE_PREFIX = 'virtual:xaendar-style?';

/**
 * Prefix of the resolved id of a compiled style module. The leading null byte is the
 * Rollup/Vite convention marking a virtual module, so that no other plugin tries to load it from disk.
 */
export const RESOLVED_STYLE_MODULE_PREFIX = `\0${STYLE_MODULE_PREFIX}`;
