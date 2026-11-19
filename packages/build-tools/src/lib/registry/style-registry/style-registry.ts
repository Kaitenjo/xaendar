/**
 * Tracks which component files depend on which style files.
 *
 * Unlike the template registry, this registry is keyed by every concrete style
 * dependency that participates in the final stylesheet graph, not just by the
 * `styleUrl` entry file. This lets the plugin react to future preprocessors
 * (SCSS, Less, etc.) where a single entry file may expand to many imported
 * partials.
 */

/**
 * Map from style dependency paths to the set of component paths that depend on them.
 */
const styleDependencyToComponentPaths = new Map<string, Set<string>>();
/**
 * Map from component paths to the set of style dependency paths they depend on.
 */
const componentPathToStyleDependencies = new Map<string, Set<string>>();

/**
 * Registers that `componentPath` depends on `dependencyPath`.
 *
 * @param dependencyPath - Absolute path of the style file.
 * @param componentPath - Absolute path of the component file depending on it.
 */
export function registerStyleDependency(dependencyPath: string, componentPath: string): void {
  styleDependencyToComponentPaths.getOrInsert(dependencyPath, new Set()).add(componentPath);
  componentPathToStyleDependencies.getOrInsert(componentPath, new Set()).add(dependencyPath);
}

/**
 * Returns the component files that currently depend on `dependencyPath`.
 *
 * @param dependencyPath - Absolute path of the style file.
 * @returns The component paths, `undefined` if no component depends on the file.
 */
export function findComponentPathsForStyleDependency(dependencyPath: string): Set<string> | undefined {
  return styleDependencyToComponentPaths.get(dependencyPath);
}

/**
 * Clears all style dependencies previously registered for `componentPath`.
 *
 * @param componentPath - Absolute path of the component file.
 */
export function clearStyleDependenciesForComponent(componentPath: string): void {
  const dependencyPaths = componentPathToStyleDependencies.get(componentPath);
  if (!dependencyPaths) {
    return;
  }

  for (const dependencyPath of dependencyPaths) {
    // ! is a safe assertion because both maps are always updated together
    const componentPaths = styleDependencyToComponentPaths.get(dependencyPath)!;
    componentPaths.delete(componentPath);
    if (!componentPaths.size) {
      styleDependencyToComponentPaths.delete(dependencyPath);
    }
  }

  componentPathToStyleDependencies.delete(componentPath);
}

/**
 * Resets the entire style registry. Called on dev server shutdown.
 */
export function clearStyleRegistry(): void {
  styleDependencyToComponentPaths.clear();
  componentPathToStyleDependencies.clear();
}
