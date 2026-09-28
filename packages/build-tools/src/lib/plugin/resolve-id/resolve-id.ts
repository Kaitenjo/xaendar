import type { HookHandler, Plugin } from 'vite';
import { TEMPLATE_MODULE_PREFIX } from '../../costants/template-module-prefix';

/**
 * Resolves the import specifiers of compiled template modules (injected in
 * component files by the `transform` hook) to virtual module ids, loaded by the `load` hook.
 *
 * Every `import` must be resolved to a module id before Vite can load it. Since the
 * specifier points to no file nor package, without this hook Vite would fail with
 * "Failed to resolve import". The returned id is prefixed with a null byte, the
 * Rollup/Vite convention marking a virtual module, so that no other plugin (nor
 * Vite itself) tries to read it from disk.
 *
 * @example
 * // foo.xd.component.ts, after the `transform` hook
 * import { render as __Foo_render } from 'virtual:xaendar-template:/src/foo/foo.xd.component.html?signals=count&lang.js';
 *
 * // The hook is invoked with that specifier and returns
 * '\0virtual:xaendar-template:/src/foo/foo.xd.component.html?signals=count&lang.js'
 *
 * // which is then passed to the `load` hook, compiling the template into
 * // `export { render }`. A `bar.xd.component.ts` using the same template and
 * // signals imports the same specifier: it resolves to the same id, so Vite
 * // loads (and compiles) the module only once.
 *
 * @example
 * // Any other specifier is left to the other plugins
 * import { BaseWebComponent } from '@xaendar/core'; // → null
 */
export function createResolveIdHook(): NonNullable<HookHandler<Plugin['resolveId']>> {
  return function resolveId(source) {
    return source.startsWith(TEMPLATE_MODULE_PREFIX) ? `\0${source}` : null;
  };
}
