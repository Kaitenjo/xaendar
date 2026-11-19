import { buildExternalHelpers, type File, type PluginAPI, type PluginObject, type types as BabelTypes } from '@babel/core';
import type { Plugin } from 'vite';

/**
 * The module the modules transpiled by Babel import the helpers of the decorators from.
 */
export const BABEL_HELPERS_MODULE = 'virtual:xaendar-babel-helpers';

/**
 * The helpers the transform of the decorators uses, with the ones they use in turn: the module of the helpers declares
 * them all, so that a bundle holds one copy of each.
 */
const DECORATOR_HELPERS = ['applyDecs2311', 'checkInRHS', 'identity', 'setFunctionName', 'toPrimitive', 'toPropertyKey'];

/**
 * The Babel plugin making the modules it transpiles import the helpers of the decorators from
 * {@link BABEL_HELPERS_MODULE}, where Babel would declare a copy of them in each module declaring a decorated class
 * (about 5 kB each). The other helpers stay in the modules, as Babel writes them.
 *
 * @param api - The API of Babel.
 * @returns The plugin.
 */
export function importBabelHelpers(api: PluginAPI): PluginObject {
  return {
    name: 'xaendar-babel-helpers',
    pre(file) {
      const imported = new Map<string, BabelTypes.Identifier>();
      file.set('helperGenerator', (name: string) => (DECORATOR_HELPERS.includes(name) ? importHelper(file, name, imported, api.types) : undefined));
    }
  };
}

/**
 * Creates the plugin of Vite giving the modules transpiled by Babel the module {@link BABEL_HELPERS_MODULE}: the helpers
 * of the decorators, as Babel writes them.
 *
 * @returns The plugin.
 */
export function createBabelHelpersPlugin(): Plugin {
  return {
    name: 'xaendar:babel-helpers',
    resolveId(source) {
      return source === BABEL_HELPERS_MODULE ? `\0${BABEL_HELPERS_MODULE}` : null;
    },
    load(id) {
      return id === `\0${BABEL_HELPERS_MODULE}` ? buildExternalHelpers(DECORATOR_HELPERS, 'module') : null;
    }
  };
}

/**
 * Imports a helper from {@link BABEL_HELPERS_MODULE} into the module being transpiled, once.
 *
 * @param file - The module being transpiled.
 * @param name - The name of the helper.
 * @param imported - The local names of the helpers the module imports already, by name.
 * @param types - The builders of the nodes of Babel.
 * @returns A reference to the local name of the helper.
 */
function importHelper(file: File, name: string, imported: Map<string, BabelTypes.Identifier>, types: PluginAPI['types']): BabelTypes.Identifier {
  let local = imported.get(name);
  if (!local) {
    local = file.scope.generateUidIdentifier(name);
    imported.set(name, local);
    const [declaration] = file.path.unshiftContainer('body', types.importDeclaration([types.importSpecifier(local, types.identifier(name))], types.stringLiteral(BABEL_HELPERS_MODULE)));
    file.scope.registerDeclaration(declaration);
  }

  return types.cloneNode(local);
}
