import type { NodeCompilerHost } from '../models/node-compiler-host/node-compiler-host.model';
import type { StyleCompileResult } from './style-compile-result.type';

/**
 * Contract implemented by each stylesheet compiler supported by the build tool.
 *
 * Each compiler is responsible for recognizing one stylesheet format and
 * transforming its entry file into a CSS payload plus the list of files that
 * the owning component should watch for rebuilds.
 */
export interface StyleCompiler {
  /**
   * Returns whether the compiler can handle the given stylesheet path.
   * @param filePath - Absolute or relative path of the stylesheet entry.
   */
  supports(filePath: string): boolean;
  /**
   * Compiles a stylesheet entry into plain CSS and returns the dependency set.
   * @param entryPath - Path to the stylesheet entry file to compile.
   * @param host - Compiler host used to read the file from disk.
   * @returns The compiled CSS content and every file path the component should watch.
   */
  compile(entryPath: string, host: NodeCompilerHost): StyleCompileResult;
}
