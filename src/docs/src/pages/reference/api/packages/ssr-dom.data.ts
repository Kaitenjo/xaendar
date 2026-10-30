import type { ApiPackage } from '../api.data';
import { ENTRY_SERVER } from '../../../tools/ssr/ssr.snippets';

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
      guides: ['tools/ssr']
    }
  ]
};
