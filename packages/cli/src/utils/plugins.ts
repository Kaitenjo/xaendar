import babel from '@rolldown/plugin-babel';
import { xaendarPlugin } from '@xaendar/build-tools';

/**
 * Bundler plugins used by the CLI: Babel (to transpile decorators) followed by the Xaendar compiler plugin.
 */
export const PLUGINS = [
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
  xaendarPlugin()
]