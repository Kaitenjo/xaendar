import babel from '@rolldown/plugin-babel';
import { xaendarPlugin, type XaendarPluginOptions } from '@xaendar/build-tools';
import type { PluginOption } from 'vite';
import { readXaendarConfig, resolveSsrPaths } from './xaendar-config/xaendar-config.utils';

/**
 * Creates the bundler plugins used by the CLI: Babel (to transpile decorators) followed by the Xaendar compiler
 * plugin, configured from the `xaendar.json` of the project in the working directory.
 *
 * @returns The plugins, in the order they must run.
 */
export function createPlugins(): PluginOption[] {
  return [
    babel({
      presets: [
        {
          preset: () => ({
            plugins: [
              [
                '@babel/plugin-proposal-decorators',
                { version: '2023-11' }
              ]
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
    xaendarPlugin(readPluginOptions())
  ];
}

/**
 * Reads the options of the Xaendar plugin from the `xaendar.json` of the project in the working directory: the
 * patterns of the custom elements of other libraries (`"customElements": ["sl-*"]`), and the entry of the rendering on
 * the server, resolved against the project, when the project renders its pages there.
 *
 * @returns The options, without patterns nor rendering on the server when the file or the fields are missing.
 */
function readPluginOptions(): XaendarPluginOptions {
  const config = readXaendarConfig();
  const ssr = config?.ssr && { entry: resolveSsrPaths(config.ssr).entry };
  return { 
    customElements: config?.customElements, 
    ssr 
  };
}
