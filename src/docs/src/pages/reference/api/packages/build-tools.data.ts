import { INSTALLATION_VITE_CONFIG } from '../../../installation/installation.snippets';
import { CSS_MINIFY } from '../../../tools/build/build.snippets';
import { SSR_VITE_CONFIG } from '../../../tools/ssr/deployment/deployment.snippets';
import type { ApiPackage } from '../api.data';
import { BUILD_TOOLS_VITE_CONFIG } from './build-tools.snippets';

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
        },
        {
          name: 'strictEvents',
          group: 'options',
          signature: 'strictEvents?: boolean',
          snippets: ['components/native-element-event-warning.txt', 'components/strict-events-config.json']
        },
        {
          name: 'security',
          group: 'options',
          signature: 'security?: { readonly urls?: \'off\' | \'warn\' | \'remove\'; readonly resourceUrls?: \'off\' | \'warn\' | \'remove\'; readonly trustedOrigins?: readonly string[]; readonly rejectUnsafeBindings?: boolean }',
          snippets: ['templates/security-config.json', 'templates/unsafe-binding-error.txt', 'templates/unsafe-url-warning.txt', 'templates/untrusted-resource-warning.txt']
        },
        {
          name: 'ssr',
          group: 'options',
          signature: 'ssr?: { readonly entry: string; readonly staticComponents?: boolean }',
          snippets: [SSR_VITE_CONFIG, 'tools/ssr-xaendar.json', 'tools/ssr-static-components.json']
        },
        {
          name: 'staticReport',
          group: 'options',
          signature: 'staticReport?: boolean',
          snippets: ['tools/ssr-static-report.txt']
        }
      ],
      usage: [
        { key: 'configuration', snippets: [INSTALLATION_VITE_CONFIG, 'api/build-tools/plugin-order-error.txt'] },
        { key: 'cli', snippets: ['api/build-tools/xaendar.json'] },
        { key: 'errors', snippets: ['tools/plugin-errors.txt'] },
        { key: 'styles', snippets: [CSS_MINIFY, 'components/scss-error.txt'] }
      ],
      guides: ['tools/build', 'installation', 'tools/cli', 'components/registration', 'tools/ssr/deployment']
    },
    {
      name: 'XaendarPluginOptions',
      kind: 'type',
      signature: [
        'type XaendarPluginOptions = {',
        '  readonly customElements?: readonly string[];',
        '  readonly strictEvents?: boolean;',
        '  readonly security?: {',
        '    readonly urls?: \'off\' | \'warn\' | \'remove\';',
        '    readonly resourceUrls?: \'off\' | \'warn\' | \'remove\';',
        '    readonly trustedOrigins?: readonly string[];',
        '    readonly rejectUnsafeBindings?: boolean;',
        '  };',
        '  readonly ssr?: {',
        '    readonly entry: string;',
        '    readonly staticComponents?: boolean;',
        '  };',
        '  readonly staticReport?: boolean;',
        '};'
      ].join('\n'),
      members: [
        {
          name: 'customElements',
          group: 'options',
          signature: 'readonly customElements?: readonly string[]'
        },
        {
          name: 'strictEvents',
          group: 'options',
          signature: 'readonly strictEvents?: boolean'
        },
        {
          name: 'security',
          group: 'options',
          signature: 'readonly security?: { readonly urls?: \'off\' | \'warn\' | \'remove\'; readonly resourceUrls?: \'off\' | \'warn\' | \'remove\'; readonly trustedOrigins?: readonly string[]; readonly rejectUnsafeBindings?: boolean }'
        },
        {
          name: 'ssr',
          group: 'options',
          signature: 'readonly ssr?: { readonly entry: string; readonly staticComponents?: boolean }'
        },
        {
          name: 'staticReport',
          group: 'options',
          signature: 'readonly staticReport?: boolean'
        }
      ],
      guides: ['tools/build', 'components/registration', 'tools/ssr/static-components']
    },
    {
      name: 'buildLibrary',
      kind: 'function',
      signature: [
        'function buildLibrary(options: {',
        '  readonly name: string;',
        '  readonly root: string;',
        '  readonly entry?: string;',
        '  readonly outDir: string;',
        '  readonly ssr?: boolean;',
        '  readonly customElements?: readonly string[];',
        '  readonly strictEvents?: boolean;',
        '  readonly plugins?: readonly PluginOption[];',
        '  readonly xaendarVersion: string;',
        '  readonly dependencies?: Readonly<Record<string, string>>;',
        '}): Promise<void>'
      ].join('\n'),
      members: [
        {
          name: 'name',
          group: 'options',
          signature: 'readonly name: string'
        },
        {
          name: 'root',
          group: 'options',
          signature: 'readonly root: string'
        },
        {
          name: 'entry',
          group: 'options',
          signature: 'readonly entry?: string'
        },
        {
          name: 'outDir',
          group: 'options',
          signature: 'readonly outDir: string'
        },
        {
          name: 'ssr',
          group: 'options',
          signature: 'readonly ssr?: boolean'
        },
        {
          name: 'customElements',
          group: 'options',
          signature: 'readonly customElements?: readonly string[]'
        },
        {
          name: 'strictEvents',
          group: 'options',
          signature: 'readonly strictEvents?: boolean'
        },
        {
          name: 'plugins',
          group: 'options',
          signature: 'readonly plugins?: readonly PluginOption[]'
        },
        {
          name: 'xaendarVersion',
          group: 'options',
          signature: 'readonly xaendarVersion: string'
        },
        {
          name: 'dependencies',
          group: 'options',
          signature: 'readonly dependencies?: Readonly<Record<string, string>>'
        }
      ],
      usage: [
        { key: 'package', snippets: ['api/build-tools/library-package.txt'] }
      ],
      guides: ['tools/build', 'tools/cli']
    }
  ]
};
