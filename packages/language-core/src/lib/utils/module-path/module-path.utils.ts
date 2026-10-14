import { existsSync } from 'node:fs';
import { posix } from 'node:path';
import { normalizeFileName, resolvePosixPath } from '../path/path.utils';

/**
 * Resolves a module import path to an actual file system path.
 * Handles both relative paths (./button.component) and package paths (@scope/pkg).
 *
 * @param baseDir - The directory to resolve relative imports from
 * @param modulePath - The import module path
 * @returns The resolved file path, in posix format, or undefined if not found
 */
export function resolveModulePath(baseDir: string, modulePath: string): string | undefined {
  // Handle relative imports
  if (modulePath.startsWith('.')) {
    const resolvedPath = resolvePosixPath(baseDir, modulePath);

    // Try as-is (might already have extension)
    if (existsSync(resolvedPath)) {
      return resolvedPath;
    }

    // Try with .ts extension
    if (existsSync(`${resolvedPath}.ts`)) {
      return `${resolvedPath}.ts`;
    }

    // Try with /index.ts if directory
    if (existsSync(`${resolvedPath}/index.ts`)) {
      return `${resolvedPath}/index.ts`;
    }
  }

  // TODO: Handle package imports and tsconfig aliases
  return undefined;
}

/**
 * Writes the path to import a TypeScript file from a directory, the inverse of {@link resolveModulePath}: relative to
 * the directory, with forward slashes and without the `.ts` extension.
 *
 * @example
 * toModulePath('/src/pages', '/src/ui/button.ts');  // '../ui/button'
 * toModulePath('/src', '/src/button.ts');           // './button'
 *
 * @param baseDir - The directory the path is relative to.
 * @param fileName - The path of the file to import.
 * @returns The path, to write in an `@import`.
 */
export function toModulePath(baseDir: string, fileName: string): string {
  const path = posix.relative(normalizeFileName(baseDir), normalizeFileName(fileName)).replace(/\.ts$/, '');
  return path.startsWith('.') ? path : `./${path}`;
}
