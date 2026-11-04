import type { ApiPackage } from '../api.data';
import { CSP_NONCE } from '../../../tools/ssr/hydration/hydration.snippets';
import { ENTRY_SERVER, RENDER_INPUTS } from '../../../tools/ssr/overview/overview.snippets';
import { TRANSFER_STATE_ENTRY } from '../../../tools/ssr/transfer-state/transfer-state.snippets';

/**
 * The symbols of `@xaendar/ssr`.
 */
export const SSR_API: ApiPackage = {
  name: '@xaendar/ssr',
  symbols: [
    {
      name: 'renderToString',
      kind: 'function',
      signature: 'function renderToString<Component extends CustomElement>(component: Constructor<Component>, inputs?: RenderInputs<Component>, options?: RenderOptions): Promise<string>',
      members: [
        {
          name: 'component',
          group: 'parameters',
          signature: 'component: Constructor<Component>'
        },
        {
          name: 'inputs',
          group: 'parameters',
          signature: 'inputs?: RenderInputs<Component>',
          snippets: [RENDER_INPUTS]
        },
        {
          name: 'options',
          group: 'parameters',
          signature: 'options?: RenderOptions',
          snippets: [TRANSFER_STATE_ENTRY]
        }
      ],
      usage: [
        { key: 'entry', snippets: [ENTRY_SERVER] },
        { key: 'output', snippets: ['tools/ssr-output.html'] },
        { key: 'errors' }
      ],
      guides: ['tools/ssr/overview', 'tools/ssr/transfer-state', 'tools/ssr/hydration', 'components/lifecycle']
    },
    {
      name: 'RenderInputs',
      kind: 'type',
      signature: [
        'type RenderInputs<Component> = {',
        '  [Name in /* the inputs of Component */]?: /* the value of the input */',
        '};'
      ].join('\n'),
      usage: [
        { key: 'typing', snippets: [RENDER_INPUTS] }
      ],
      guides: ['tools/ssr/overview', 'tools/ssr/transfer-state']
    },
    {
      name: 'RenderOptions',
      kind: 'type',
      signature: 'type RenderOptions = {\n  readonly state?: Readonly<Record<string, unknown>>;\n  readonly nonce?: string;\n};',
      members: [
        {
          name: 'state',
          group: 'properties',
          signature: 'readonly state?: Readonly<Record<string, unknown>>',
          snippets: [TRANSFER_STATE_ENTRY]
        },
        {
          name: 'nonce',
          group: 'properties',
          signature: 'readonly nonce?: string',
          snippets: [CSP_NONCE]
        }
      ],
      guides: ['tools/ssr/transfer-state', 'tools/ssr/hydration']
    }
  ]
};
