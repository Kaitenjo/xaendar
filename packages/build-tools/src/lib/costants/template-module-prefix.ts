/**
 * Prefix of the import specifier of a compiled template module (see `createTemplateModuleSpecifier`).
 */
export const TEMPLATE_MODULE_PREFIX = 'virtual:xaendar-template:';

/**
 * Prefix of the resolved id of a compiled template module. The leading null byte is the
 * Rollup/Vite convention marking a virtual module, so that no other plugin tries to load it from disk.
 */
export const RESOLVED_TEMPLATE_MODULE_PREFIX = `\0${TEMPLATE_MODULE_PREFIX}`;
