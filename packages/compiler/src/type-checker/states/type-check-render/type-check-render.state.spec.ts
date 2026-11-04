import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { RenderNode } from '../../../parser/types/nodes/render-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { typeCheckRender } from './type-check-render.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as RenderNode;

/**
 * Creates a context declaring the template `row`, whose content is created in the given namespace.
 */
const withTemplate = (namespace: 'html' | 'svg' = 'html') => {
  const context = new TypeCheckContext();
  context.addUnresolvableIdentifier('row');
  context.addTemplate('row', namespace);
  return context;
};

describe('typeCheckRender', () => {
  it('checks the arguments like the ones of a call of the template, passing their number, mapping the call onto the @render', () => {
    const template = '@render row(item(), title)';
    const context = withTemplate();
    context.addUnresolvableIdentifier('item', 'signal');
    const [line] = typeCheckRender(parse(template), () => [], context);

    expect(line.text).toBe('__render(row, 2)(item(), root.title);');
    expect(line.mappings).toEqual(expect.arrayContaining([
      { columnStart: 0, columnEnd: 8, original: { start: 0, end: template.length } },
      { columnStart: 9, columnEnd: 12, original: { start: 8, end: 11 } },
      { columnStart: 17, columnEnd: 23, original: { start: template.indexOf('item()'), end: template.indexOf('item()') + 6 } }
    ]));
  });

  it('checks a template without arguments', () => {
    expect(typeCheckRender(parse('@render row()'), () => [], withTemplate())[0].text).toBe('__render(row, 0)();');
  });

  it('throws for a name not referring to a template', () => {
    expect(() => typeCheckRender(parse('@render row()'), () => [], new TypeCheckContext())).toThrow('"row" is not a template visible here');
  });

  it('throws for a template creating its content in another namespace', () => {
    expect(() => typeCheckRender(parse('@render row()'), () => [], new TypeCheckContext(withTemplate(), 'svg'))).toThrow('Template "row" is declared among HTML elements, and its content cannot be rendered among SVG elements');
  });
});
