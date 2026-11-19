import { GeneratorContext, parseTemplate, type RenderNode, type ContextCache } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerRender } from './generate-server-render.state';

const cache = {} as ContextCache;

describe('generateServerRender', () => {
  it('renders an instance of the template with the value of each argument, read once', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'template', 'template_row_0');
    context.addTemplate('row', 'html');

    expect(generateServerRender(parseTemplate('@render row(item, 1)')[0] as RenderNode, { id: 'root' }, '0', new GeneratorContext(context))).toEqual({
      pieces: [{ statement: '_ssrRenderTemplate(out, context, template_row_0, 1, [this.item, 1]);' }]
    });
  });

  it('renders an instance of the template an expression gives, or a name not referring to a template holds', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'template', 'template_row_0');
    context.addTemplate('row', 'html');

    expect(generateServerRender(parseTemplate('@render rowTemplate()(item)')[0] as RenderNode, { id: 'root' }, '0', context)).toEqual({
      pieces: [{ statement: '_ssrRenderTemplateRef(out, this.rowTemplate(), [this.item]);' }]
    });
    expect(generateServerRender(parseTemplate('@render pick(row)()')[0] as RenderNode, { id: 'root' }, '0', context)).toEqual({
      pieces: [{ statement: '_ssrRenderTemplateRef(out, this.pick(_templateRef(context, 0, template_row_0)), []);' }]
    });
  });
});
