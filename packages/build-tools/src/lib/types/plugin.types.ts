import type { CompilerOptions } from 'typescript';
import type { Logger } from 'vite';
import type { NodeCompilerHost } from '../models/node-compiler-host/node-compiler-host.model';

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
   * Whether the compiled styles must be minified, set once the Vite config is resolved.
   */
  minifyStyles: boolean;
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