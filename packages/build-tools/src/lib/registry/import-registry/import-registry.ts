/**
 * Tracks which component files (`.xd.component.ts`) import which
 * other component files, so that deleting a component can invalidate the
 * components that import it.
 *
 * Mirrors the shape of `template-registry`, but keyed on imported
 * component paths rather than template paths, and supports multiple
 * components per import (a component can be imported by several templates).
 *
 * The set of component files that currently import the component at this key.
 */
const importToComponents = new Map<string, Set<string>>();

/**
 * The set of import paths that the component at this key currently imports.
 */
const componentToImports = new Map<string, Set<string>>();

/**
 * Registers that `componentId` imports the component at `importedPath`.
 *
 * @param importedPath - Absolute path of the imported `.xd.component.ts` file.
 * @param componentId - Absolute path of the component file that imports it.
 */
export function registerImport(importedPath: string, componentId: string): void {
  const importedPathSet = importToComponents.getOrInsert(importedPath, new Set());
  importedPathSet.add(componentId);

  const importedComponentToImportsSet = componentToImports.getOrInsert(componentId, new Set());
  importedComponentToImportsSet.add(importedPath);
}

/**
 * Returns the set of component ids that currently import the given path.
 *
 * @param importedPath - Absolute path of the imported component file.
 */
export function findComponentsForImport(importedPath: string): Set<string> {
  return importToComponents.get(importedPath) ?? new Set();
}

/**
 * Clears all import mappings previously registered for `componentId`.
 *
 * Must be called before re-registering a component's imports on each
 * transform, since a template's `@import` list may change between edits
 * and stale entries would otherwise leak.
 *
 * @param componentId - Absolute path of the component file.
 */
export function clearComponentToImports(componentId: string): void {
  const previousImports = componentToImports.get(componentId);
  if (previousImports) {
    for (const importedPath of previousImports) {
      const components = importToComponents.get(importedPath);
      if (components) {
        components.delete(componentId);
        if (!components.size) {
          importToComponents.delete(importedPath);
        }
      }
    }
  }
  
  componentToImports.delete(componentId);
}

/**
 * Clears all reverse import mappings that point to `importedPath`, e.g. when
 * the imported component file itself is deleted.
 *
 * @param importedPath - Absolute path of the deleted imported component file.
 */
export function clearImportToComponents(importedPath: string): void {
  const components = importToComponents.get(importedPath);
  if (!components) {
    return;
  }

  for (const componentId of components) {
    const imports = componentToImports.get(componentId);
    if (imports) {
      imports.delete(importedPath);
      if (!imports.size) {
        componentToImports.delete(componentId);
      }
    }
  }

  importToComponents.delete(importedPath);
}

/**
 * Resets the entire import registry. Called on dev server shutdown.
 */
export function clearImportRegistry(): void {
  importToComponents.clear();
  componentToImports.clear();
}