import type { HookHandler, Plugin } from 'vite';
import { STYLE_MODULE_PREFIX } from '../../costants/style-module-prefix';
import { TEMPLATE_MODULE_PREFIX } from '../../costants/template-module-prefix';
import { parseTemplateModuleId } from '../plugin-utils/plugin.utils';

/**
 * Resolves the import specifiers of compiled template and style modules (injected in
 * component files by the `transform` hook) to virtual module ids, loaded by the `load` hook.
 *
 * Every `import` must be resolved to a module id before Vite can load it. Since the
 * specifier points to no file nor package, without this hook Vite would fail with
 * "Failed to resolve import". The returned id is prefixed with a null byte, the
 * Rollup/Vite convention marking a virtual module, so that no other plugin (nor
 * Vite itself) tries to read it from disk.
 *
 * What a template module imports (the runtime helpers, the symbols of the template) is resolved from the template, as
 * from a file next to it: a virtual module has no directory, and the package a template imports from is installed
 * where the template lives, e.g. in a package of a monorepo.
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
 * // Style modules are resolved the same way, and shared by every component using the same style file
 * import { sheet as __Foo_sheet } from 'virtual:xaendar-style?path=/src/foo/foo.css&lang.js';
 * // resolved to '\0virtual:xaendar-style?path=/src/foo/foo.css&lang.js'
 *
 * @example
 * // A template module importing a package: resolved by the other plugins as imported by /src/foo/foo.xd.component.html
 * import { formatPrice as __import_formatPrice } from '@acme/format';
 *
 * @example
 * // Any other specifier is left to the other plugins
 * import { CustomElement } from '@xaendar/core'; // → null
 */
export function createResolveIdHook(): NonNullable<HookHandler<Plugin['resolveId']>> {
  return function resolveId(source, importer) {
    if (source.startsWith(TEMPLATE_MODULE_PREFIX) || source.startsWith(STYLE_MODULE_PREFIX)) {
      return `\0${source}`;
    }

    const template = importer && parseTemplateModuleId(importer);
    return template ? this.resolve(source, template.templatePath, { skipSelf: true }) : null;
  };
}
