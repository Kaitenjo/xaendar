import { dirname } from 'node:path';
import { CompilerOptions, isExportDeclaration, isImportDeclaration, isStringLiteralLike, Program, resolveModuleName, SourceFile, sys } from 'typescript';
import { resolvePosixPath } from '../path/path.utils';

/**
 * The files each source file imports, exports from or references, cached by source file: the program
 * keeps the same object until the file changes.
 */
const directDependencies = new WeakMap<SourceFile, string[]>();

/**
 * Collects the files of the project a file depends on: the ones it imports, exports from or references,
 * and transitively theirs, types included. Files of external libraries and default libraries are left out.
 *
 * @param program - The program holding the file.
 * @param fileName - The file whose dependencies are collected.
 * @param compilerOptions - The compiler options resolving the module specifiers.
 * @returns The paths of the files it depends on, the file itself excluded.
 */
export function collectProjectDependencies(program: Program, fileName: string, compilerOptions: CompilerOptions): string[] {
  const visited = new Set<string>();
  const pending = [fileName];

  while (pending.length) {
    const sourceFile = program.getSourceFile(pending.pop()!);
    if (!sourceFile || visited.has(sourceFile.fileName) || program.isSourceFileFromExternalLibrary(sourceFile) || program.isSourceFileDefaultLibrary(sourceFile)) {
      continue;
    }

    visited.add(sourceFile.fileName);
    pending.push(...getDirectDependencies(sourceFile, compilerOptions));
  }

  visited.delete(fileName);
  return [...visited];
}

/**
 * Returns the files a source file imports, exports from or references, resolving them once per source file.
 *
 * @param sourceFile - The source file.
 * @param compilerOptions - The compiler options resolving the module specifiers.
 * @returns The paths of the files it depends on directly.
 */
function getDirectDependencies(sourceFile: SourceFile, compilerOptions: CompilerOptions): string[] {
  let dependencies = directDependencies.get(sourceFile);
  if (dependencies) {
    return dependencies;
  }

  dependencies = sourceFile.referencedFiles.map(reference => resolvePosixPath(dirname(sourceFile.fileName), reference.fileName));
  for (const statement of sourceFile.statements) {
    if ((isImportDeclaration(statement) || isExportDeclaration(statement)) && statement.moduleSpecifier && isStringLiteralLike(statement.moduleSpecifier)) {
      const { resolvedModule } = resolveModuleName(statement.moduleSpecifier.text, sourceFile.fileName, compilerOptions, sys);
      if (resolvedModule) {
        dependencies.push(resolvedModule.resolvedFileName);
      }
    }
  }

  directDependencies.set(sourceFile, dependencies);
  return dependencies;
}
