import type { ApiPackage } from '../api.data';
import { ENTRY_SERVER, RENDER_INPUTS } from '../../../tools/ssr/ssr.snippets';

/**
 * The symbols of `@xaendar/ssr`.
 */
export const SSR_API: ApiPackage = {
  name: '@xaendar/ssr',
  symbols: [
    {
      name: 'renderToString',
      kind: 'function',
      signature: 'function renderToString<Component extends CustomElement>(component: Constructor<Component>, inputs?: RenderInputs<Component>): Promise<string>',
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
        }
      ],
      usage: [
        { key: 'entry', snippets: [ENTRY_SERVER] },
        { key: 'output', snippets: ['tools/ssr-output.html'] },
        { key: 'errors' }
      ],
      guides: ['tools/ssr', 'components/lifecycle']
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
      guides: ['tools/ssr']
    }
  ]
};
