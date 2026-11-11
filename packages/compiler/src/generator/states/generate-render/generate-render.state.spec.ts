import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import { GeneratorContext } from '../../context/context';
import { generateRender } from './generate-render.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as RenderNode;

/**
 * Creates a context declaring the template `row`, whose content is created in the given namespace.
 */
const withTemplate = (namespace: 'html' | 'svg' = 'html') => {
  const context = new GeneratorContext(cache);
  context.addIdentifier('row');
  context.addTemplate('row', namespace);
  return context;
};

describe('generateRender', () => {
  it('renders the template named by its configuration, with a function of the module computing the arguments', async () => {
    const context = withTemplate();
    context.addSignalClassField('items');
    context.addIdentifier('item', 'signal');

    expect(await generateRender(parse('@render row(item(), items().length)'), 'root', '0', context, null, false)).toEqual({
      code: ['_renderTemplate(root, context, null, render0$render);']
    });
    expect(context.constantDeclarations).toEqual(['const render0$render = { template: \'row\', args: render0$args };']);
    expect(context.functionDeclarations).toEqual(['function render0$args(context) {\n  return [context.get(\'item\')(), this.items().length];\n}']);
    expect(context.readsDeclarations).toEqual([]);
  });

  it('lists the variables of the template the arguments read in the configuration', async () => {
    const context = withTemplate();
    context.addIdentifier('item', 'variable');
    context.addIdentifier('$index', 'variable');

    expect((await generateRender(parse('@render row(item, $index)'), 'div0', '1', context, null, false)).code).toEqual(['_renderTemplate(div0, context, null, div0__render1$render);']);
    expect(context.constantDeclarations).toEqual(['const div0__render1$render = { template: \'row\', args: div0__render1$args, reads: _reads0 };']);
    expect(context.functionDeclarations).toEqual(['function div0__render1$args(context) {\n  return [context.get(\'item\'), context.get(\'$index\')];\n}']);
    expect(context.readsDeclarations).toEqual(['const _reads0 = [\'$index\', \'item\'];']);
  });

  it('renders a template without arguments before the anchor, its configuration naming the template alone', async () => {
    const context = withTemplate();
    const { code } = await generateRender(parse('@render row()'), 'if0', '0', context, 'anchor', false);

    expect(code).toEqual(['_renderTemplate(if0, context, anchor, if0__render0$render);']);
    expect(context.constantDeclarations).toEqual(['const if0__render0$render = { template: \'row\' };']);
    expect(context.functionDeclarations).toEqual([]);
  });

  it('marks as separated an instance the server separates from the text preceding it', async () => {
    const context = withTemplate();
    const { code } = await generateRender(parse('@render row()'), 'root', '0', context, null, true);

    expect(code).toEqual(['_renderTemplate(root, context, null, render0$render);']);
    expect(context.constantDeclarations).toEqual(['const render0$render = { template: \'row\', separated: true };']);
  });

  it('throws for a name not referring to a template, pointing to it', async () => {
    await expect(generateRender(parse('@render row()'), 'root', '0', new GeneratorContext(cache), null, false)).rejects.toThrow(new Error('"row" is not a template visible here: declare it with <template row(…)> in this scope or in an enclosing one', { cause: { start: 8, end: 11 } }));
  });

  it('throws for a template creating its content in another namespace', async () => {
    await expect(generateRender(parse('@render row()'), 'root', '0', new GeneratorContext(withTemplate('svg')), null, false)).rejects.toThrow('Template "row" is declared among SVG elements, and its content cannot be rendered among HTML elements');
  });
});
