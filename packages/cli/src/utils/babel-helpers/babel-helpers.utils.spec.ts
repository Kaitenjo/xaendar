import { type NodePath, parseSync, type PluginAPI, type PluginObject, transformAsync, traverse, type types } from '@babel/core';
import { describe, expect, it } from 'vitest';
import { BABEL_HELPERS_MODULE, createBabelHelpersPlugin, importBabelHelpers } from './babel-helpers.utils';

/**
 * Creates a Babel plugin calling, at the end of the module, each of the given helpers twice, as a transform asking Babel
 * for them does.
 *
 * @param helpers - The names of the helpers.
 * @returns The plugin.
 */
function callHelpers(helpers: string[]): (api: PluginAPI) => PluginObject {
  return ({ types: builders }) => ({
    visitor: {
      Program: {
        exit(path, state) {
          for (let i = 0; i < helpers.length * 2; i++) {
            path.pushContainer('body', builders.expressionStatement(builders.callExpression(state.file.addHelper(helpers[i % helpers.length]), [])));
          }
        }
      }
    }
  });
}

/**
 * Lists the names a module reads without declaring them.
 *
 * @param code - The code of the module.
 * @returns The names.
 */
function readGlobals(code: string): string[] {
  let globals: string[] = [];
  traverse(parseSync(code, { babelrc: false, configFile: false, sourceType: 'module' })!, {
    Program(path: NodePath<types.Program>) {
      globals = Object.keys((path.scope as unknown as { globals: Record<string, unknown> }).globals);
    }
  });
  return globals;
}

describe('importBabelHelpers()', () => {
  it('imports the helpers of the decorators from the module of the helpers, once, and leaves the others in the module', async () => {
    const result = await transformAsync('export const a = 1;\n', { babelrc: false, configFile: false, plugins: [callHelpers(['applyDecs2311', 'identity', 'extends']), importBabelHelpers] });
    const code = result!.code!;

    expect(code.match(/import \{ applyDecs2311 as _applyDecs \} from "virtual:xaendar-babel-helpers";/g)).toHaveLength(1);
    expect(code.match(/import \{ identity as _identity \} from "virtual:xaendar-babel-helpers";/g)).toHaveLength(1);
    expect(code.match(/^_applyDecs\(\);$/gm)).toHaveLength(2);
    expect(code).not.toContain('function _applyDecs');
    expect(code).toContain('function _extends()');
  });
});

describe('createBabelHelpersPlugin()', () => {
  it('gives the modules the helpers of the decorators, which read no helper they do not declare', () => {
    const plugin = createBabelHelpersPlugin();
    const resolveId = plugin.resolveId as (source: string) => string | null;
    const load = plugin.load as (id: string) => string | null;

    expect(resolveId(BABEL_HELPERS_MODULE)).toBe(`\0${BABEL_HELPERS_MODULE}`);
    expect(resolveId('./card')).toBeNull();
    const code = load(`\0${BABEL_HELPERS_MODULE}`)!;
    expect(code.split('\n')[0]).toBe('export { _applyDecs2311 as applyDecs2311, _checkInRHS as checkInRHS, _identity as identity, _setFunctionName as setFunctionName, _toPrimitive as toPrimitive, _toPropertyKey as toPropertyKey };');
    expect(readGlobals(code).filter(name => name.startsWith('_'))).toEqual([]);
    expect(load('/src/card.ts')).toBeNull();
  });
});
