import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser/parser';
import type { RenderNode } from '../../parser/types/nodes/render-node.type';
import type { ElementNamespace } from '../../types/element-namespace.type';
import { getRenderedTemplate } from './render-target.utils';

const parseRender = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as RenderNode;

const templates = (namespace: ElementNamespace) => (name: string) => name === 'row' ? namespace : undefined;

describe('getRenderedTemplate', () => {
  it('returns the name of a template creating its content in the namespace of the @render', () => {
    expect(getRenderedTemplate(parseRender('@render row(item)'), templates('svg'), 'svg')).toBe('row');
  });

  it.each([
    ['a name not referring to a template', '@render other(item)'],
    ['an expression', '@render row()(item)'],
    ['a member access', '@render templates.row(item)']
  ])('returns nothing for %s, whose value is the template', (_description, template) => {
    expect(getRenderedTemplate(parseRender(template), templates('html'), 'html')).toBeUndefined();
  });

  it.each([
    ['html', 'svg', 'HTML', 'SVG'],
    ['mathml', 'html', 'MathML', 'HTML'],
    ['svg', 'mathml', 'SVG', 'MathML']
  ] as const)('throws for a template declared among %s elements rendered among %s elements, pointing to its name', (templateNamespace, namespace, templateName, name) => {
    const render = () => getRenderedTemplate(parseRender('@render row(item)'), templates(templateNamespace), namespace);
    expect(render).toThrow(`Template "row" is declared among ${templateName} elements, and its content cannot be rendered among ${name} elements: declare it in the namespace it is rendered in`);
    expect(render).toThrow(expect.objectContaining({ cause: { start: 8, end: 11 } }));
  });
});
