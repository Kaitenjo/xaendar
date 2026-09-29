import { compile } from '@xaendar/compiler';
import { dirname } from 'node:path';
import type { HookHandler, Plugin } from 'vite';
import { registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import type { XaendarPluginState } from '../../types/plugin.types';
import type { StyleCompileResult } from '../../types/style-compile-result.type';
import { TemplateModuleRequest } from '../../types/template-module-request.type';
import { extractImportedComponentPaths, generateStyleModule, generateTemplateModule, getMetadataOrExtract, parseStyleModuleId, parseTemplateModuleId } from '../plugin-utils/plugin.utils';
import { compileStyle } from '../style/compile-style';

type LoadHook = NonNullable<HookHandler<Plugin['load']>>;

/**
 * Compiles a template into the module exporting its render function, and a style
 * file into the module exporting its stylesheet.
 *
 * Each module is requested (and therefore compiled) only by components that are
 * part of the module graph, and exactly once for every template/signals pair or
 * style file, no matter how many components share it.
 */
export function createLoadHook(state: XaendarPluginState): LoadHook {
  return async function load(this, id) {
    const stylePath = parseStyleModuleId(id);
    if (stylePath !== undefined) {
      return loadStyleModule(this, state, stylePath);
    }

    const request = parseTemplateModuleId(id);
    if (request) {
      return loadTemplateModule(this, request);
    }
    
    return null;

}

/**
 * Compiles a style file into the module exporting its stylesheet, watching every file the
 * compiled CSS depends on: editing any of them invalidates the module.
 */
function loadStyleModule(ctx: ThisParameterType<LoadHook>, state: XaendarPluginState, stylePath: string): ReturnType<LoadHook> {
  let styleResult: StyleCompileResult;
  try {
    styleResult = compileStyle(stylePath, state.host);
  } catch (err) {
    return ctx.error(`Failed to compile style - ${stylePath}\n${err}`);
  }

  for (let i = 0; i < styleResult.dependencyPaths.length; i++) {
    ctx.addWatchFile(styleResult.dependencyPaths[i]);
  }

  // See the template module about the empty mappings map.
  return {
    code: generateStyleModule(styleResult.cssText),
    map: { mappings: '' },
    moduleType: 'js'
  };
}

/**
 * Compiles a template into the module exporting its render function, watching the template and all imported components.
 * @param ctx The context object providing methods for adding watch files and reporting errors.
 * @param request The template module request containing the template path and signals.
 * @returns A promise resolving to the module representing the compiled template, or an error if compilation fails.
 */
async function loadTemplateModule(ctx: ThisParameterType<LoadHook>, request: TemplateModuleRequest): Promise<ReturnType<LoadHook>> {
   const { templatePath, signals } = request;

    /*
      Watching the template, and the components it imports whose metadata shape the generated bindings,
      links them to this module: editing any of them invalidates the compiled render function.
    */
    ctx.addWatchFile(templatePath);
    const templateSource = state.host.readFile(templatePath);
    if (templateSource === undefined) {
      return ctx.error(`Could not find template at ${templatePath}`);
    }

    /*
      Watching all the components imported in the template, and linking them to this module: 
      editing any of them invalidates the compiled render function.
    */
    const importedComponentPaths = extractImportedComponentPaths(templateSource, dirname(templatePath));
    for (let i = 0; i < importedComponentPaths.length; i++) {
      const importedPath = importedComponentPaths[i]
      if (state.host.fileExists(importedPath)) {
        ctx.addWatchFile(importedPath);
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
      return ctx.error(`Failed to compile template - ${templatePath}\n${err}`);
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