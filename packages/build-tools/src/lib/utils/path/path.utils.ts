import { resolve } from 'node:path';

/**
 * Converts every backslash separator of `path` to a forward slash, matching the posix format
 * Vite and TypeScript use for module ids and source file names (the drive letter is preserved,
 * e.g. `C:/src/foo.ts`).
 *
 * Every path the plugin uses as a registry key must be in this format, so that paths produced
 * by the plugin match the ones received from Vite hooks (`transform`, `watchChange`) and the
 * ones read from TypeScript source files.
 *
 * @param path - The path to convert.
 * @returns The path with forward slash separators only.
 */
export function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Resolves a sequence of path segments into an absolute path, like `node:path` `resolve()`,
 * but always returning it in posix format (see {@link toPosixPath}): on Windows `resolve()`
 * emits backslash separators even when every segment is a posix path.
 *
 * @param segments - The path segments to resolve.
 * @returns The resolved absolute path, with forward slash separators only.
 */
export function resolvePosixPath(...segments: string[]): string {
  return toPosixPath(resolve(...segments));
}
