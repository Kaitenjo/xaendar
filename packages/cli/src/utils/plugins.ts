import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PluginOption } from 'vite';

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
    xaendarPlugin({ customElements: readCustomElements() })
  ];
}

/**
 * Reads the patterns of the custom elements of other libraries (`"customElements": ["sl-*"]`) from the
 * `xaendar.json` of the project in the working directory.
 *
 * @returns The patterns, none when the file or the field is missing.
 */
function readCustomElements(): readonly string[] {
  const path = resolve(process.cwd(), 'xaendar.json');
  if (!existsSync(path)) {
    return [];
  }

  const { customElements } = JSON.parse(readFileSync(path, 'utf-8')) as { customElements?: string[] };
  return customElements ?? [];
}
