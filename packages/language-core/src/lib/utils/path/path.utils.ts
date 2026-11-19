import { resolve } from 'node:path';

/**
 * Normalizes a path to compare it with another one written in another way: with forward slash separators and a
 * lowercase drive letter, as the paths of a file may differ in both on Windows (e.g. `C:\src\a.ts` from the
 * file system, `c:/src/a.ts` from an editor URI, `C:/src/a.ts` from TypeScript).
 *
 * @param fileName - The path to normalize.
 * @returns The normalized path.
 */
export function normalizeFileName(fileName: string): string {
  return toPosixPath(fileName).replace(/^[A-Z]:/, drive => drive.toLowerCase());
}

/**
 * Converts every backslash separator of `path` to a forward slash, matching the posix format
 * TypeScript uses for source file names (the drive letter is preserved, e.g. `C:/src/foo.ts`).
 *
 * @param path - The path to convert.
 * @returns The path with forward slash separators only.
 */
export function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Resolves a sequence of path segments into an absolute path, like `node:path` `resolve()`,
 * but always returning it in posix format (see {@link toPosixPath}).
 *
 * @param segments - The path segments to resolve.
 * @returns The resolved absolute path, with forward slash separators only.
 */
export function resolvePosixPath(...segments: string[]): string {
  return toPosixPath(resolve(...segments));
}
