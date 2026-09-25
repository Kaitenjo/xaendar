/**
 * template-registry.ts
 *
 * Module-level singleton that tracks the reverse mapping from a template
 * file's absolute path to the absolute path of the component file that
 * declares it via `templateUrl`.
 * Populated inside the plugin's `transform`
 * hook, the first time a component is processed and its templatePath is
 * resolved — and consulted from `watchChange` when a template file is
 * deleted, so the corresponding type-check shim can be removed even though
 * the component `.ts` file itself is untouched.
 */

/**
 * Map a template path to the set of component Paths (absolute paths of the component files)
 * The mapping is many-to-many:
 * - A template could theoretically be referenced by multiple components in the same or different files
 */
const templateToComponentsPath = new Map<string, Set<string>>();
/**
 * Map a component path to the set of template paths it references.
 * The mapping is many-to-many: 
 * - A component path could reference 1 to N template files where N is the number of components declared in that file.
 */
const componentPathToTemplates = new Map<string, Set<string>>();

/**
 * Registers (or updates) the association between a template file and the
 * component that declares it. Safe to call on every `transform` run for a
 * component — it's a plain overwrite, not an increment, so re-registering
 * the same pair is a no-op in practice.
 *
 * @param templatePath - Absolute path of the `.html` template file.
 * @param componentPath - Absolute path of the component file that references
 *   it via `templateUrl`.
 */
export function registerTemplatePath(templatePath: string, componentPath: string): void {
  templateToComponentsPath.getOrInsert(templatePath, new Set()).add(componentPath);
  componentPathToTemplates.getOrInsert(componentPath, new Set()).add(templatePath);
}

/**
 * Looks up which component declares the given template path.
 *
 * @param templatePath - Absolute path of the `.html` template file.
 * @returns The absolute path of the owning component, or `undefined` if no
 *   component has registered this template path (e.g. it was never
 *   processed, or was already removed).
 */
export function findComponentPathsForTemplate(templatePath: string): Set<string> | undefined {
  return templateToComponentsPath.get(templatePath);
}

/**
 * Removes every template mapping that points to the given component,
 * e.g. when the component file itself is deleted. A component could in
 * principle have registered only one template at a time (a component has
 * a single `templateUrl`), but this scans defensively in case of stale
 * entries from a renamed templateUrl.
 *
 * @param componentPath - Absolute path of the component file being torn down.
 */
export function removeComponentPath(componentPath: string): void {
  const templatePaths = componentPathToTemplates.get(componentPath);
  if (!templatePaths) {
    return;
  }

  for (const templatePath of [...templatePaths]) {
    const ownerIds = templateToComponentsPath.get(templatePath);
    if (ownerIds) {
      ownerIds.delete(componentPath);
      if (!ownerIds.size) {
        templateToComponentsPath.delete(templatePath);
      }
    }
  }

  componentPathToTemplates.delete(componentPath);
}

/**
 * Clears the entire registry. Intended to be called alongside
 * `disposeLanguageService()` so a dev-server restart doesn't leak stale
 * mappings into a fresh session.
 */
export function clearTemplateRegistry(): void {
  templateToComponentsPath.clear();
  componentPathToTemplates.clear();
}