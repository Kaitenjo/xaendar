import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateRender } from './generate-render.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as RenderNode;

/**
 * Creates a context declaring the template `row`, whose content is created in the given namespace.
 */
const withTemplate = (namespace: 'html' | 'svg' = 'html') => {
  const context = new CompilerContext();
  context.addIdentifier('row');
  context.addTemplate('row', namespace);
  return context;
};

describe('generateRender', () => {
  it('renders the template read from its scope, with a function for each argument', async () => {
    const context = withTemplate();
    context.addSignalClassField('items');
    context.addIdentifier('item', 'signal');

    expect(await generateRender(parse('@render row(item(), items().length)'), 'root', '0', context, null)).toEqual({
      code: ['_renderTemplate(root, context, null, context.get(\'row\'), [() => context.get(\'item\')(), () => this.items().length]);']
    });
  });

  it('renders a template without arguments before the anchor', async () => {
    const { code } = await generateRender(parse('@render row()'), 'if0', '0', withTemplate(), 'anchor');
    expect(code).toEqual(['_renderTemplate(if0, context, anchor, context.get(\'row\'), []);']);
  });

  it('throws for a name not referring to a template, pointing to it', async () => {
    await expect(generateRender(parse('@render row()'), 'root', '0', new CompilerContext(), null)).rejects.toThrow(new Error('"row" is not a template visible here: declare it with <template row(…)> in this scope or in an enclosing one', { cause: { start: 8, end: 11 } }));
  });

  it('throws for a template creating its content in another namespace', async () => {
    await expect(generateRender(parse('@render row()'), 'root', '0', new CompilerContext(withTemplate('svg')), null)).rejects.toThrow('Template "row" is declared among SVG elements, and its content cannot be rendered among HTML elements');
  });
});
