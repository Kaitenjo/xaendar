import { loadTsConfig } from '@xaendar/language-core';
import { resolve } from 'node:path';
import type { Logger, Plugin } from 'vite';
import { CLIENT_STRATEGY, SERVER_STRATEGY } from '../../costants/plugin-strategies';
import { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';
import type { XaendarPluginOptions } from '../../types/xaendar-plugin-options.type';
import { createBuildEndHook } from '../build-end/build-end';
import { createBuildStartHook } from '../build-start/build-start';
import { createConfigResolvedHook } from '../config-resolved/config-resolved';
import { createConfigHook } from '../config/config';
import { createConfigureServerHook } from '../configure-server/configure-server';
import { createHotUpdateHook } from '../hot-update/hot-update';
import { createLoadHook } from '../load/load';
import { createResolveIdHook } from '../resolve-id/resolve-id';
import { createTransformHook } from '../transform/transform';
import { createWatchChangeHook } from '../watch-change/watch-change';
import { resolveWorkspaceLibraries, withLibraryDependencies } from '../../utils/workspace-libraries/workspace-libraries.utils';

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
 * ## Rendering on the server
 *
 * With `ssr`, the modules evaluated on the server register templates compiled into HTML (see `@xaendar/ssr`),
 * and the dev server renders each page it serves with the entry, in place of `<!--xd-ssr-->` in `index.html`.
 *
 * ## Libraries of a workspace
 *
 * With `libraries`, the project imports the libraries of its workspace from their sources, by the names of their
 * packages, and the files of a library are compiled with its own options: whether it renders on the server, and the
 * custom elements of other libraries its templates use.
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
  // The project tsconfig is resolved from the directory Vite is launched from, the one of a library from its folder.
  const tsConfig = loadTsConfig(options.library ? resolve(options.library.root) : process.cwd());
  let logger: Logger | undefined;

  const logError = (error: unknown, prefix: string): void => {
    const stack = error instanceof Error ? error.stack : '';
    const redMessage = `\x1b[31m\rXaendar: ${prefix}\n${error} ${stack?.slice(stack.indexOf('\n    at'))}\x1b[0m\n`;
    (logger ?? console).error(redMessage);
  };

  const state: XaendarPluginState = {
    host,
    compilerOptions: withLibraryDependencies(tsConfig.options, options.library?.dependencies),
    projectFileNames: tsConfig.fileNames,
    customElements: options.customElements ?? [],
    strictEvents: options.strictEvents ?? true,
    minifyStyles: false,
    isBuild: false,
    root: process.cwd(),
    ssr: options.ssr,
    libraries: resolveWorkspaceLibraries(options.library ? [options.library] : options.libraries, process.cwd()),
    staticReport: options.staticReport ?? false,
    setLogger: value => logger = value,
    logInfo: message => (logger ?? console).info(message),
    logError,
    strategies: { 
      client: CLIENT_STRATEGY, 
      server: options.ssr || options.library?.ssr ? SERVER_STRATEGY : CLIENT_STRATEGY
    }
  };

  return {
    name: 'xaendar',
    config: createConfigHook(state),
    configResolved: createConfigResolvedHook(state),
    buildStart: createBuildStartHook(state),
    resolveId: createResolveIdHook(),
    load: createLoadHook(state),
    transform: createTransformHook(state),
    buildEnd: createBuildEndHook(state),
    watchChange: createWatchChangeHook(state),
    hotUpdate: createHotUpdateHook(state),
    configureServer: createConfigureServerHook(state),
  };
}