import type { EnvironmentModuleNode, HookHandler, Plugin } from 'vite';
import { findComponentPathsForDependency } from '../../registry/dependency-registry/dependency-registry';
import { findComponentPathsForTemplate } from '../../registry/template-registry/template-registry';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';

/**
 * Fully invalidates the components depending on the changed file, and the ones whose template was just created.
 *
 * A component depends on files the dev server does not relate to it (see the dependency registry): the
 * classes it inherits from, whose signal members are encoded in the template module specifier injected
 * by the `transform` hook, and the files its type-check reads. A file it imports statically is only
 * soft-invalidated, reusing its transform result, and a file holding only types is not part of the module
 * graph at all: a hard invalidation forces the `transform` hook to run again. A component transformed before
 * its template existed was left without its render function, so it is compiled again once the template is
 * created. The components are added to the HMR update as well, since the changed file might not be part of
 * the module graph at all (e.g. a `.d.ts` file).
 *
 * The hook runs for each environment, invalidating the modules of its own graph: the ones of the server are evaluated
 * again by the next page the server renders. A file the environment evaluates is handed to the `hotUpdate` of its
 * strategy too: the one of the server rendering reloads the page when the browser does not evaluate the file.
 *
 * @param state - The shared plugin state, holding the dev server.
 * @returns The `hotUpdate` hook handler.
 */
export function createHotUpdateHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['hotUpdate']>> {
  return function hotUpdate({ type, file, modules, timestamp }) {
    if (modules.length) {
      state.strategies[this.environment.config.consumer].hotUpdate?.(file, state.server!);
    }

    const componentPaths = new Set(findComponentPathsForDependency(file));
    if (type === 'create') {
      const componentsPathsForTemplate = findComponentPathsForTemplate(file)
      if (componentsPathsForTemplate?.size) {
        for (const componentPath of componentsPathsForTemplate) {
          componentPaths.add(componentPath);
        }
      }
    }

    if (!componentPaths.size) {
      return;
    }

    const moduleGraph = this.environment.moduleGraph;
    const updatedModules = new Set<EnvironmentModuleNode>(modules);
    for (const componentPath of componentPaths) {
      const componentModules = moduleGraph.getModulesByFile(componentPath);
      if (componentModules?.size) {
        for (const componentModule of componentModules) {
          moduleGraph.invalidateModule(componentModule, new Set(), timestamp, true);
          updatedModules.add(componentModule);
        }
      }
    }

    return [...updatedModules];
  };
}
