import { CompilerContext, parseTemplate, type RenderNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerRender } from './generate-server-render.state';

describe('generateServerRender', () => {
  it('renders an instance of the template with a function for each argument', () => {
    const context = new CompilerContext();
    context.addIdentifier('row');
    context.addTemplate('row', 'html');

    expect(generateServerRender(parseTemplate('@render row(item, 1)')[0] as RenderNode, { id: 'root' }, '0', context)).toEqual({
      pieces: [{ statement: '_ssrRenderTemplate(out, context, context.get(\'row\'), [() => this.item, () => 1]);' }]
    });
  });

  it('throws when the name is not a template visible in the scope', () => {
    expect(() => generateServerRender(parseTemplate('@render row()')[0] as RenderNode, { id: 'root' }, '0', new CompilerContext())).toThrow('"row" is not a template visible here');
  });
});
