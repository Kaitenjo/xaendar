import type { EnvironmentModuleNode, HookHandler, Plugin } from 'vite';
import { findComponentPathsForBaseClassDependency } from '../../registry/base-class-registry/base-class-registry';

/**
 * Fully invalidates the components inheriting from a class declared in the changed file.
 *
 * The signal members of a component, encoded in the template module specifier injected by
 * the `transform` hook, also depend on its base classes. Their files are usually imported
 * statically by the component, so the dev server only soft-invalidates it, reusing its
 * transform result with the stale signal members: a hard invalidation forces the `transform`
 * hook to run again. The components are added to the HMR update as well, since the changed
 * file might not be part of the module graph at all (e.g. a `.d.ts` file).
 *
 * @returns The `hotUpdate` hook handler.
 */
export function createHotUpdateHook(): NonNullable<HookHandler<Plugin['hotUpdate']>> {
  return function hotUpdate({ file, modules, timestamp }) {
    const componentPaths = findComponentPathsForBaseClassDependency(file);
    if (!componentPaths?.size) {
      return;
    }

    const moduleGraph = this.environment.moduleGraph;
    const updatedModules = new Set<EnvironmentModuleNode>(modules);
    for (const componentPath of componentPaths) {
      for (const componentModule of moduleGraph.getModulesByFile(componentPath) ?? []) {
        moduleGraph.invalidateModule(componentModule, new Set(), timestamp, true);
        updatedModules.add(componentModule);
      }
    }

    return [...updatedModules];
  };
}
