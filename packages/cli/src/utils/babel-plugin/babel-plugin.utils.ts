import babel from '@rolldown/plugin-babel';
import type { PluginOption } from 'vite';
import { createBabelHelpersPlugin, importBabelHelpers } from '../babel-helpers/babel-helpers.utils';

/**
 * Creates the Babel plugin transpiling the decorators, which the Xaendar plugin needs before it (the build of a library
 * adds the Xaendar plugin by itself), followed by the plugin giving the transpiled modules the helpers of the
 * decorators, which they import from a single module (see {@link importBabelHelpers}).
 *
 * It imports nothing of `@xaendar/build-tools`, so that a configuration of Vitest needing only the decorators, as the
 * one of the repository for `@xaendar/directives`, loads it without the compiler.
 *
 * @returns The plugins.
 */
export function createBabelPlugin(): PluginOption {
  return [
    babel({
      presets: [
        {
          preset: () => ({
            plugins: [
              [
                '@babel/plugin-proposal-decorators',
                { version: '2023-11' }
              ],
              importBabelHelpers
            ]
          }),
          rolldown: {
            filter: {
              code: '@'
            }
          }
        }
      ]
    }),
    createBabelHelpersPlugin()
  ];
}
