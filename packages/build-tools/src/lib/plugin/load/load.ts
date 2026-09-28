import { compile } from '@xaendar/compiler';
import { dirname } from 'node:path';
import type { HookHandler, Plugin } from 'vite';
import { registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import type { XaendarPluginState } from '../../types/plugin.types';
import { extractImportedComponentPaths, generateTemplateModule, getMetadataOrExtract, parseTemplateModuleId } from '../plugin-utils/plugin.utils';

/**
 * Compiles a template into the module exporting its render function.
 *
 * The module is requested (and therefore compiled) only by components that are
 * part of the module graph, and exactly once for every template/signals pair,
 * no matter how many components share it.
 */
export function createLoadHook(state: XaendarPluginState): NonNullable<HookHandler<Plugin['load']>> {
  return async function load(this, id) {
    const request = parseTemplateModuleId(id);
    if (!request) {
      return null;
    }

    const { templatePath, signals } = request;

    /*
      Watching the template, and the components it imports whose metadata shape the generated bindings,
      links them to this module: editing any of them invalidates the compiled render function.
    */
    this.addWatchFile(templatePath);
    const templateSource = state.host.readFile(templatePath);
    if (templateSource === undefined) {
      return this.error(`Could not find template at ${templatePath}`);
    }

    /*
      Watching all the components imported in the template, and linking them to this module: 
      editing any of them invalidates the compiled render function.
    */
    const importedComponentPaths = extractImportedComponentPaths(templateSource, dirname(templatePath));
    for (let i = 0; i < importedComponentPaths.length; i++) {
      const importedPath = importedComponentPaths[i]
      if (state.host.fileExists(importedPath)) {
        this.addWatchFile(importedPath);
      }
    }

    let compiledFunctions: string;
    try {
      compiledFunctions = await compile(templateSource, {
        signals,
        cache: {
          getOrInsert: getMetadataOrExtract,
          set: registerMetadata
        }
      });
    } catch (err) {
      return this.error(`Failed to compile template - ${templatePath}\n${err}`);
    }

    /*
      An empty mappings map marks the module as having no original source. Without it, Vite would generate
      a sourcemap treating this generated JS as the original source, named after the template path and
      shown by DevTools as a fake `.html` file.
      TODO: replace it with a real sourcemap from the generated code back to the template.
    */
    return {
      code: generateTemplateModule(compiledFunctions),
      map: { mappings: '' },
      moduleType: 'js'
    };
  };
}
