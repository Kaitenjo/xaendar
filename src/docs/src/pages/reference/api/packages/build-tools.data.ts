import type { ApiPackage } from '../api.data';
import { INSTALLATION_VITE_CONFIG } from '../../../installation/installation.snippets';
import { BUILD_TOOLS_VITE_CONFIG } from './build-tools.snippets';
import { CSS_MINIFY } from '../../../tools/build/build.snippets';

/**
 * The symbols of `@xaendar/build-tools`.
 */
export const BUILD_TOOLS_API: ApiPackage = {
  name: '@xaendar/build-tools',
  symbols: [
    {
      name: 'xaendarPlugin',
      kind: 'function',
      signature: 'function xaendarPlugin(options?: XaendarPluginOptions): Plugin',
      members: [
        {
          name: 'customElements',
          group: 'options',
          signature: 'customElements?: readonly string[]',
          snippets: [BUILD_TOOLS_VITE_CONFIG, 'components/not-imported-error.txt', 'api/build-tools/imported-and-declared-error.txt']
        }
      ],
      usage: [
        { key: 'configuration', snippets: [INSTALLATION_VITE_CONFIG, 'api/build-tools/plugin-order-error.txt'] },
        { key: 'cli', snippets: ['api/build-tools/xaendar.json'] },
        { key: 'errors', snippets: ['tools/plugin-errors.txt'] },
        { key: 'styles', snippets: [CSS_MINIFY, 'components/scss-error.txt'] }
      ],
      guides: ['tools/build', 'installation', 'tools/cli', 'components/registration']
    },
    {
      name: 'XaendarPluginOptions',
      kind: 'type',
      signature: [
        'type XaendarPluginOptions = {',
        '  readonly customElements?: readonly string[];',
        '};'
      ].join('\n'),
      members: [
        {
          name: 'customElements',
          group: 'options',
          signature: 'readonly customElements?: readonly string[]'
        }
      ],
      guides: ['tools/build', 'components/registration']
    }
  ]
};
