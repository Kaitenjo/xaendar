/**
 * Tracks which component files depend on which base class files.
 *
 * The signal members of a component, encoded in its template module
 * specifier, also depend on the classes it inherits from: files the
 * component usually imports statically, so the dev server only
 * soft-invalidates the component when one of them changes, reusing its
 * stale transform result. This registry lets the plugin find and fully
 * invalidate the components affected by a base class file change.
 */

/**
 * Map from base class dependency paths to the set of component paths that depend on them.
 */
const dependencyToComponentPaths = new Map<string, Set<string>>();

/**
 * Map from component paths to the set of base class dependency paths they depend on.
 */
const componentPathToDependencies = new Map<string, Set<string>>();

/**
 * Registers that `componentPath` depends on the base class file `dependencyPath`.
 *
 * @param dependencyPath - Path of the base class file being depended on.
 * @param componentPath - Path of the component depending on `dependencyPath`.
 */
export function registerBaseClassDependency(dependencyPath: string, componentPath: string): void {
  dependencyToComponentPaths.getOrInsert(dependencyPath, new Set()).add(componentPath);
  componentPathToDependencies.getOrInsert(componentPath, new Set()).add(dependencyPath);
}

/**
 * Returns the component files that currently depend on the base class file `dependencyPath`.
 *
 * @param dependencyPath - Path of the base class file.
 * @returns The set of component paths depending on it, or `undefined` if there's none.
 */
export function findComponentPathsForBaseClassDependency(dependencyPath: string): Set<string> | undefined {
  return dependencyToComponentPaths.get(dependencyPath);
}

/**
 * Clears all base class dependencies previously registered for `componentPath`.
 *
 * @param componentPath - Path of the component whose dependencies are cleared.
 */
export function clearBaseClassDependenciesForComponent(componentPath: string): void {
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
 * Resets the entire base class registry.
 *
 * Called on dev server shutdown.
 */
export function clearBaseClassRegistry(): void {
  dependencyToComponentPaths.clear();
  componentPathToDependencies.clear();
}
