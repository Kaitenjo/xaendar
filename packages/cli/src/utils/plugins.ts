import babel from '@rolldown/plugin-babel';
import { xaendarPlugin, type XaendarPluginOptions } from '@xaendar/build-tools';
import { resolve } from 'node:path';
import type { PluginOption } from 'vite';
import type { XaendarConfig } from '../types/xaendar-config.type';
import { readXaendarConfig, resolveSsrPaths } from './xaendar-config/xaendar-config.utils';

/**
 * Creates the bundler plugins used by the CLI: Babel (to transpile decorators) followed by the Xaendar compiler
 * plugin, configured from the `xaendar.json` of the project in the working directory.
 *
 * @param staticReport - Whether the build tells what keeps each interactive component in the bundle of the browser.
 * @returns The plugins, in the order they must run.
 */
export function createPlugins(staticReport?: boolean): PluginOption[] {
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
    xaendarPlugin({ ...readPluginOptions(), staticReport })
  ];
}

/**
 * Reads the options of the Xaendar plugin from the `xaendar.json` of the project in the working directory: the
 * patterns of the custom elements of other libraries (`"customElements": ["sl-*"]`), the entry of the rendering on
 * the server, resolved against the project, when the project renders its pages there, with whether the build searches
 * the static components (`staticComponents`, `false` unless the file sets it to `true`), and the libraries of the
 * workspace (`libs`), which the project imports from their sources.
 *
 * @returns The options, without patterns, rendering on the server nor libraries when the file or the fields are missing.
 */
function readPluginOptions(): XaendarPluginOptions {
  const config = readXaendarConfig();
  const ssr = config?.ssr && { entry: resolveSsrPaths(config.ssr).entry, staticComponents: config.ssr.staticComponents === true };
  return {
    customElements: config?.customElements,
    ssr,
    libraries: config?.libs && readLibraries(config.libs)
  };
}

/**
 * Reads the libraries of the workspace for the Xaendar plugin: the name of the package of each one, its folder
 * resolved against the workspace, its entry, and its options.
 *
 * @param libs - The `libs` of `xaendar.json`.
 * @returns The libraries.
 */
function readLibraries(libs: NonNullable<XaendarConfig['libs']>): XaendarPluginOptions['libraries'] {
  const names = Object.keys(libs);
  return names.map(name => {
    const { root, entry, ssr, customElements } = libs[name];
    return { name, root: resolve(process.cwd(), root), entry, ssr: ssr === true, customElements };
  });
}
