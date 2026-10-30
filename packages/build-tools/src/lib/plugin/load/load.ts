import { compile, type CompilerCache } from '@xaendar/compiler';
import { compileServer } from '@xaendar/ssr-compiler';
import { dirname } from 'node:path';
import type { HookHandler, Plugin } from 'vite';
import { registerMetadata } from '../../registry/metadata-registry/metadata-registry';
import type { XaendarPluginState } from '../../types/plugin.types';
import type { StyleCompileResult } from '../../types/style-compile-result.type';
import { TemplateModuleRequest } from '../../types/template-module-request.type';
import { isServerRendering } from '../../utils/server-rendering/server-rendering.utils';
import { extractImportedComponentPaths, generateServerStyleModule, generateServerTemplateModule, generateStyleModule, generateTemplateModule, getImportOrExtract, getMetadataOrExtract, parseStyleModuleId, parseTemplateModuleId } from '../plugin-utils/plugin.utils';
import { compileStyle } from '../style/compile-style';
import { minifyCss } from '../style/minify-css/minify-css.utils';

/**
 * Matches the TypeScript declaration files, which have no code to import.
 */
const DECLARATION_FILE = /\.d\.[cm]?tsx?$/;

type LoadHook = NonNullable<HookHandler<Plugin['load']>>;

/**
 * Compiles a template into the module exporting its render function, and a style
 * file into the module exporting its stylesheet.
 *
 * Each module is requested (and therefore compiled) only by components that are
 * part of the module graph, and exactly once for every template/signals pair or
 * style file, no matter how many components share it.
 *
 * For the rendering on the server (see `isServerRendering`), the same module of an environment of the server exports
 * the render function writing the HTML of the template, compiled by `@xaendar/ssr-compiler`, and the text of the stylesheet.
 */
export function createLoadHook(state: XaendarPluginState): LoadHook {
  return async function load(this, id) {
    const server = isServerRendering(state, this);
    const stylePath = parseStyleModuleId(id);
    if (stylePath !== undefined) {
      return loadStyleModule(this, stylePath, server);
    }

    const request = parseTemplateModuleId(id);
    if (request) {
      return loadTemplateModule(this, request, server);
    }

    return null;
}

/**
 * Compiles a style file into the module exporting its stylesheet, watching every file the
 * compiled CSS depends on: editing any of them invalidates the module.
 *
 * @param context - The context of the hook.
 * @param stylePath - The path of the style file.
 * @param server - Whether the module is evaluated on the server, exporting the text of the CSS.
 * @returns The module.
 */
async function loadStyleModule(context: ThisParameterType<LoadHook>, stylePath: string, server: boolean): Promise<ReturnType<LoadHook>> {
  let styleResult: StyleCompileResult;
  try {
    styleResult = await compileStyle(stylePath, state.host);
    if (state.minifyStyles && styleResult.cssText) {
      styleResult.cssText = minifyCss(styleResult.cssText, stylePath);
    }
  } catch (err) {
    return context.error(`Failed to compile style - ${stylePath}\n${err}`);
  }

  for (let i = 0; i < styleResult.dependencyPaths.length; i++) {
    context.addWatchFile(styleResult.dependencyPaths[i]);
  }

  // See the template module about the empty mappings map.
  return {
    code: server ? generateServerStyleModule(styleResult.cssText) : generateStyleModule(styleResult.cssText),
    map: { mappings: '' },
    moduleType: 'js'
  };
}

/**
 * Compiles a template into the module exporting its render function, watching the template and all imported components.
 * @param context The context object providing methods for adding watch files and reporting errors.
 * @param request The template module request containing the template path and signals.
 * @param server Whether the module is evaluated on the server, exporting the render function writing HTML.
 * @returns A promise resolving to the module representing the compiled template, or an error if compilation fails.
 */
async function loadTemplateModule(context: ThisParameterType<LoadHook>, request: TemplateModuleRequest, server: boolean): Promise<ReturnType<LoadHook>> {
   const { templatePath, signals, shadowingMembers } = request;

    /*
      Watching the template, and the components it imports whose metadata shape the generated bindings,
      links them to this module: editing any of them invalidates the compiled render function.
    */
    context.addWatchFile(templatePath);
    const templateSource = state.host.readFile(templatePath);
    if (templateSource === undefined) {
      return context.error(`Could not find template at ${templatePath}`);
    }

    /*
      Watching all the components imported in the template, and linking them to this module: 
      editing any of them invalidates the compiled render function.
    */
    const importedComponentPaths = extractImportedComponentPaths(templateSource, dirname(templatePath), state.compilerOptions);
    for (let i = 0; i < importedComponentPaths.length; i++) {
      const importedPath = importedComponentPaths[i]
      if (state.host.fileExists(importedPath)) {
        context.addWatchFile(importedPath);
      }
    }

    /*
      The modules the template imports are imported by its module too, so the bundler keeps them in the chunk graph
      of the template. The ones of `@import lazy` are not: something else loads them on demand.
    */
    const dependencyPaths = new Set<string>();
    const eagerPaths = extractImportedComponentPaths(templateSource, dirname(templatePath), state.compilerOptions, true);
    for (let i = 0; i < eagerPaths.length; i++) {
      if (state.host.fileExists(eagerPaths[i]) && !DECLARATION_FILE.test(eagerPaths[i])) {
        dependencyPaths.add(eagerPaths[i]);
      }
    }

    const cache: CompilerCache = {
      getOrInsert: (classNameOrSelector, path) => getMetadataOrExtract(classNameOrSelector, path, state.compilerOptions),
      getImport: (imported, local, baseDir, path) => getImportOrExtract(imported, local, baseDir, path, state.compilerOptions),
      set: registerMetadata
    };
    // The symbols the template imports are imported by the render code, resolved against the directory of the template
    const templateDir = dirname(templatePath);
    const { customElements } = state;

    let compiledFunctions: string;
    try {
      compiledFunctions = server
        ? await compileServer(templateSource, { signals, templateDir, shadowingMembers, customElements, cache })
        : await compile(templateSource, { signals, templateDir, shadowingMembers, customElements, cache });
    } catch (err) {
      return context.error(`Failed to compile template - ${templatePath}\n${err}`);
    }

    /*
      An empty mappings map marks the module as having no original source. Without it, Vite would generate
      a sourcemap treating this generated JS as the original source, named after the template path and
      shown by DevTools as a fake `.html` file.
      TODO: replace it with a real sourcemap from the generated code back to the template.
    */
    const dependencies = Array.from(dependencyPaths);
    return {
      code: server ? generateServerTemplateModule(compiledFunctions, dependencies) : generateTemplateModule(compiledFunctions, dependencies),
      map: { mappings: '' },
      moduleType: 'js'
    };
  };
}