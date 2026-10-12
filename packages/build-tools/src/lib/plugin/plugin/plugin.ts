import { loadTsConfig } from '@xaendar/language-core';
import type { Logger, Plugin } from 'vite';
import { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginState } from '../../types/plugin.types';
import type { XaendarPluginOptions } from '../../types/xaendar-plugin-options.type';
import { createBuildEndHook } from '../build-end/build-end';
import { createConfigResolvedHook } from '../config-resolved/config-resolved';
import { createConfigureServerHook } from '../configure-server/configure-server';
import { createHotUpdateHook } from '../hot-update/hot-update';
import { createLoadHook } from '../load/load';
import { createResolveIdHook } from '../resolve-id/resolve-id';
import { createTransformHook } from '../transform/transform';
import { createWatchChangeHook } from '../watch-change/watch-change';

/**
 * Vite plugin that compiles Xaendar DSL template files (`.xd.component.html`)
 * and wires the generated render function to the associated component class.
 *
 * ## Template modules
 *
 * Every template is compiled into its own virtual module exporting its render
 * function, imported and registered by the component files referencing it.
 * Templates are compiled only when a component using them is part of the module
 * graph, and components sharing a template share the same module, so the
 * template is compiled and bundled once.
 *
 * ## Style modules
 *
 * Likewise, every style file is compiled into its own virtual module exporting
 * a `CSSStyleSheet`, so components sharing a style file, in the same file or in
 * different ones, share the same module and adopt the same stylesheet instance.
 *
 * ## Dev mode
 *
 * Files are transformed on demand when the browser requests them. The plugin
 * registers the template as a watch file via `this.addWatchFile` so that
 * modifying the template invalidates the component module and triggers HMR.
 *
 * ## Production build
 *
 * The same `transform` hook runs for every component file during the esbuild
 * bundling phase. The output is handed to esbuild as TypeScript, which strips
 * the types and produces the final JavaScript bundle.
 *
 * ## Type check
 *
 * Vite does not type-check TypeScript. Besides checking each template against its
 * component class, the plugin checks the rest of the program: as `tsc --noEmit`
 * does once a build ends, failing it on errors, and in dev mode file by file as
 * they are served, not serving a file with errors.
 *
 * ## Custom elements of other libraries
 *
 * Every tag with a dash used by a template must be a component imported in it, unless it matches one of the
 * `customElements` patterns: those tags belong to other libraries and are used like native elements.
 *
 * @param options - The options of the plugin.
 * @returns A Vite {@link Plugin} instance.
 *
 * @example
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { xaendarPlugin } from '@xaendar/build-tools';
 *
 * export default defineConfig({
 *   plugins: [xaendarPlugin({ customElements: ['sl-*'] })],
 * });
 */
export function xaendarPlugin(options: XaendarPluginOptions = {}): Plugin {
  const host = new NodeCompilerHost;
  // The project tsconfig is resolved from the directory Vite is launched from.
  const tsConfig = loadTsConfig(process.cwd());
  let logger: Logger | undefined;

  const logError = (error: unknown, prefix: string): void => {
    const stack = error instanceof Error ? error.stack : '';
    const redMessage = `\x1b[31m\rXaendar: ${prefix}\n${error} ${stack?.slice(stack.indexOf('\n    at'))}\x1b[0m\n`;
    (logger ?? console).error(redMessage);
  };

  const state: XaendarPluginState = {
    host,
    compilerOptions: tsConfig.options,
    projectFileNames: tsConfig.fileNames,
    customElements: options.customElements ?? [],
    minifyStyles: false,
    isBuild: false,
    setLogger: value => logger = value,
    logError
  };

  return {
    name: 'xaendar',
    configResolved: createConfigResolvedHook(state),
    resolveId: createResolveIdHook(),
    load: createLoadHook(state),
    transform: createTransformHook(state),
    buildEnd: createBuildEndHook(state),
    watchChange: createWatchChangeHook(state),
    hotUpdate: createHotUpdateHook(),
    configureServer: createConfigureServerHook(state),
  };
}