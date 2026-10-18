import type { ApiPackage } from '../api.data';

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
          snippets: ['api/build-tools/vite.config.ts', 'components/not-imported-error.txt', 'api/build-tools/imported-and-declared-error.txt']
        }
      ],
      usage: [
        { key: 'configuration', snippets: ['installation/vite.config.ts', 'api/build-tools/plugin-order-error.txt'] },
        { key: 'cli', snippets: ['api/build-tools/xaendar.json'] },
        { key: 'errors', snippets: ['tools/plugin-errors.txt'] },
        { key: 'styles', snippets: ['tools/css-minify.ts', 'components/scss-error.txt'] }
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
