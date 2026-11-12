import { GeneratorContext, parseTemplate, type RenderNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerRender } from './generate-server-render.state';

const cache = {} as ContextCache;

describe('generateServerRender', () => {
  it('renders an instance of the template with the value of each argument, read once', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'value', 'template_row_0');
    context.addTemplate('row', 'html');

    expect(generateServerRender(parseTemplate('@render row(item, 1)')[0] as RenderNode, { id: 'root' }, '0', new GeneratorContext(context))).toEqual({
      pieces: [{ statement: '_ssrRenderTemplate(out, context, template_row_0, 1, [this.item, 1]);' }]
    });
  });

  it('throws when the name is not a template visible in the scope', () => {
    expect(() => generateServerRender(parseTemplate('@render row()')[0] as RenderNode, { id: 'root' }, '0', new GeneratorContext(cache))).toThrow('"row" is not a template visible here');
  });
});
