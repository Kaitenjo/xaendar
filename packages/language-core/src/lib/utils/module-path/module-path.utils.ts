import { existsSync } from 'node:fs';
import { posix } from 'node:path';
import { type CompilerOptions, ModuleKind, ModuleResolutionKind, resolveModuleName, sys } from 'typescript';
import { normalizeFileName, resolvePosixPath, toPosixPath } from '../path/path.utils';
import type { ResolvedModule } from '../../types/resolved-module.type';

/**
 * How the paths that are not relative are resolved when the project has no options: as a bundler does, reading the
 * `exports` of the packages.
 */
const DEFAULT_COMPILER_OPTIONS: CompilerOptions = { module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler };

/**
 * Resolves the path of an `@import` to the module it leads to. A relative path (`./button.component`) is resolved
 * against the directory of the template; any other one, the name of a package (`@scope/pkg`) or an alias of the
 * project (`paths`, `baseUrl`), as the TypeScript files of the project resolve it.
 *
 * @param baseDir - The directory of the template.
 * @param modulePath - The path, as written in the `@import`.
 * @param compilerOptions - The options of the project, which drive how the paths that are not relative are resolved.
 * @returns The module, `undefined` if the path leads to no file.
 */
export function resolveModule(baseDir: string, modulePath: string, compilerOptions = DEFAULT_COMPILER_OPTIONS): ResolvedModule | undefined {
  if (modulePath.startsWith('.')) {
    const fileName = resolveRelativePath(baseDir, modulePath);
    return fileName ? { fileName, external: false } : undefined;
  }

  const { resolvedModule } = resolveModuleName(modulePath, resolvePosixPath(baseDir, '__template__.ts'), compilerOptions, sys);
  return resolvedModule && { fileName: toPosixPath(resolvedModule.resolvedFileName), external: !!resolvedModule.isExternalLibraryImport };
}

/**
 * Resolves the path of an `@import` to the file declaring the module it leads to (see {@link resolveModule}).
 *
 * @param baseDir - The directory of the template.
 * @param modulePath - The path, as written in the `@import`.
 * @param compilerOptions - The options of the project, which drive how the paths that are not relative are resolved.
 * @returns The path of the file, in posix format, `undefined` if the path leads to no file.
 */
export function resolveModulePath(baseDir: string, modulePath: string, compilerOptions?: CompilerOptions): string | undefined {
  return resolveModule(baseDir, modulePath, compilerOptions)?.fileName;
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

/**
 * Resolves a relative path to a file: the path itself, the path with the `.ts` extension, or the `index.ts` of the
 * directory.
 *
 * @param baseDir - The directory the path is relative to.
 * @param modulePath - The relative path.
 * @returns The path of the file, in posix format, `undefined` if none exists.
 */
function resolveRelativePath(baseDir: string, modulePath: string): string | undefined {
  const resolvedPath = resolvePosixPath(baseDir, modulePath);
  const candidates = [resolvedPath, `${resolvedPath}.ts`, `${resolvedPath}/index.ts`];
  return candidates.find(candidate => existsSync(candidate));
}
