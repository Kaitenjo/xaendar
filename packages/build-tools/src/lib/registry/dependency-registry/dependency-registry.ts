/**
 * Tracks which component files depend on which other files of the project.
 *
 * A component depends on files that the dev server does not relate to it: the classes it inherits
 * from, whose signal members are encoded in its template module specifier, and every file its
 * type-check reads, types included. The dev server only soft-invalidates the component when a file
 * it imports statically changes, reusing its stale transform result, and ignores a file holding only
 * types, which is not part of the module graph. This registry lets the plugin find and fully
 * invalidate the components affected by the change of one of these files.
 */

/**
 * Map from dependency paths to the set of component paths that depend on them.
 */
const dependencyToComponentPaths = new Map<string, Set<string>>();

/**
 * Map from component paths to the set of dependency paths they depend on.
 */
const componentPathToDependencies = new Map<string, Set<string>>();

/**
 * Registers that `componentPath` depends on the file `dependencyPath`.
 *
 * @param dependencyPath - Path of the file being depended on.
 * @param componentPath - Path of the component depending on `dependencyPath`.
 */
export function registerDependency(dependencyPath: string, componentPath: string): void {
  dependencyToComponentPaths.getOrInsert(dependencyPath, new Set()).add(componentPath);
  componentPathToDependencies.getOrInsert(componentPath, new Set()).add(dependencyPath);
}

/**
 * Returns the component files that currently depend on the file `dependencyPath`.
 *
 * @param dependencyPath - Path of the file.
 * @returns The set of component paths depending on it, or `undefined` if there's none.
 */
export function findComponentPathsForDependency(dependencyPath: string): Set<string> | undefined {
  return dependencyToComponentPaths.get(dependencyPath);
}

/**
 * Clears all dependencies previously registered for `componentPath`.
 *
 * @param componentPath - Path of the component whose dependencies are cleared.
 */
export function clearDependenciesForComponent(componentPath: string): void {
  const dependencyPaths = componentPathToDependencies.get(componentPath);
  if (!dependencyPaths) {
    return;
  }

  for (const dependencyPath of dependencyPaths) {
    // ! is a safe assertion because both maps are always updated together
    const componentPaths = dependencyToComponentPaths.get(dependencyPath)!;
    componentPaths.delete(componentPath);
    if (!componentPaths.size) {
      dependencyToComponentPaths.delete(dependencyPath);
    }
  }

  componentPathToDependencies.delete(componentPath);
}

/**
 * Resets the entire dependency registry.
 *
 * Called on dev server shutdown.
 */
export function clearDependencyRegistry(): void {
  dependencyToComponentPaths.clear();
  componentPathToDependencies.clear();
}
