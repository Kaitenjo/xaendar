import { loadCompilerOptions } from '@xaendar/language-core';
import type { Logger, Plugin } from 'vite';
import { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginState } from '../../types/plugin.types';
import { createConfigureServerHook } from '../configure-server/configure-server';
import { createTransformHook } from '../transform/transform';
import { createWatchChangeHook } from '../watch-change/watch-change';

/**
 * Vite plugin that compiles Xaendar DSL template files (`.xd.component.html`)
 * and injects the generated render methods into the associated component class.
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
 * @returns A Vite {@link Plugin} instance.
 *
 * @example
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { xaendarPlugin } from '@xaendar/build-tools';
 *
 * export default defineConfig({
 *   plugins: [xaendarPlugin()],
 * });
 */
export function xaendarPlugin(): Plugin {
  const host = new NodeCompilerHost;
  const compilerOptions = loadCompilerOptions(import.meta.url);
  let logger: Logger | undefined;

  const logError = (error: unknown, prefix: string): void => {
    const stack = error instanceof Error ? error.stack : '';
    const redMessage = `\x1b[31m\rXaendar: ${prefix} - ${error} ${stack?.slice(stack.indexOf('\n    at'))}\x1b[0m\n`;
    (logger ?? console).error(redMessage.replace(/^Error:\s*/, ''));
  };

  const state: XaendarPluginState = {
    host,
    compilerOptions,
    setLogger: (value) => logger = value,
    logError
  };

  return {
    name: 'xaendar',
    transform: createTransformHook(state),
    watchChange: createWatchChangeHook(state),
    configureServer: createConfigureServerHook(state),
  };
}