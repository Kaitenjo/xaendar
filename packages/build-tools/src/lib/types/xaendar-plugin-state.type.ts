import type { CompilerOptions } from 'typescript';
import type { Environment, Logger, ViteDevServer } from 'vite';
import type { NodeCompilerHost } from '../models/node-compiler-host/node-compiler-host.model';
import type { XaendarPluginStrategy } from './plugin-strategy.type';
import type { XaendarPluginOptions } from './xaendar-plugin-options.type';

/**
 * Mutable runtime state shared across the Xaendar Vite plugin hooks.
 */
export type XaendarPluginState = {
  /**
   * File-system access used to resolve, read, and watch component inputs.
   */
  host: NodeCompilerHost;
  /**
   * Compiler options loaded from the project tsconfig.
   */
  compilerOptions: CompilerOptions;
  /**
   * Project files matched by the project tsconfig, added to the type-check
   * Program so ambient declarations (e.g. `globals.d.ts`) are visible.
   */
  projectFileNames: readonly string[];
  /**
   * Patterns of the tag names of the custom elements of other libraries, used by templates like native elements.
   */
  customElements: readonly string[];
  /**
   * Whether the compiled styles must be minified, set once the Vite config is resolved.
   */
  minifyStyles: boolean;
  /**
   * Whether the plugin runs in a build, which must fail when a component cannot be compiled.
   * Set once the Vite config is resolved.
   */
  isBuild: boolean;
  /**
   * The rendering on the server, when the plugin is configured with it.
   */
  ssr?: XaendarPluginOptions['ssr'];
  /**
   * The dev server, set once it is configured: the server rendering reloads its page through it.
   */
  server?: ViteDevServer;
  /**
   * The strategy of each consumer of the environments of Vite, read by the hooks from the environment they run for:
   * the browser gets the one of the browser, the server the one of the server rendering when the plugin renders on the
   * server, the one of the browser otherwise.
   */
  strategies: Readonly<Record<Environment['config']['consumer'], XaendarPluginStrategy>>;
  /**
   * Sets the active Vite logger used by hook-level error reporting.
   */
  setLogger(logger: Logger | undefined): void;
  /**
   * Logs an error message using the active Vite logger, if available.
   * @param error The error object to be logged.
   * @param prefix A string prefix to provide context for the error message.
   */
  logError(error: unknown, prefix: string): void;
};