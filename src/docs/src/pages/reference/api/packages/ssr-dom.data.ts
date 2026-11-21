import { ENTRY_SERVER } from '../../../tools/ssr/overview/overview.snippets';
import type { ApiPackage } from '../api.data';

/**
 * The symbols of `@xaendar/ssr/dom`.
 */
export const SSR_DOM_API: ApiPackage = {
  name: '@xaendar/ssr/dom',
  symbols: [
    {
      name: 'loadServerDom',
      kind: 'function',
      signature: 'function loadServerDom(): void',
      usage: [
        { key: 'order', snippets: [ENTRY_SERVER] }
      ],
      guides: ['tools/ssr/overview']
    }
  ]
};
