import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import type { RenderNode } from '../../types/nodes/render-node.type';
import { getTemplateSpan } from '../../utils/expression-validator/expression-validator';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseRender', () => {
  it('parses the name of the template and the arguments, with their spans in the template', () => {
    const template = '<p>a</p>@render row(item(), \'b\', 1 + 2)<p>c</p>';
    const [, node] = parse(template) as RenderNode[];
    expect(node).toMatchObject({
      type: ASTNodeType.Render,
      callee: 'row',
      calleeSpan: { start: template.indexOf('row'), end: template.indexOf('row') + 3 },
      span: { start: template.indexOf('@render'), end: template.indexOf(')<p>') + 1 }
    });
    expect(node.arguments.map(argument => getTemplateSpan(argument))).toEqual([
      { start: template.indexOf('item()'), end: template.indexOf('item()') + 6 },
      { start: template.indexOf('\'b\''), end: template.indexOf('\'b\'') + 3 },
      { start: template.indexOf('1 + 2'), end: template.indexOf('1 + 2') + 5 }
    ]);
  });

  it('parses a render without arguments', () => {
    const [node] = parse('@render empty()') as RenderNode[];
    expect(node.arguments).toHaveLength(0);
  });

  it('throws when the template ends before the call', () => {
    const tokens: Token[] = [{ type: TokenType.RENDER, span: { start: 0, end: 8 } }];
    expect(() => new Parser('@render ', tokens).parse()).toThrow('@render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item())');
  });

  it('throws when the name is not an identifier, pointing to it', () => {
    const template = '@render 2row()';
    expect(() => parse(template)).toThrow('\'2row\' cannot name a template: it must be an identifier');
    expect(() => parse(template)).toThrow(expect.objectContaining({ span: { start: 8, end: 12 } }));
  });

  it('throws for an argument that is not a valid template expression', () => {
    expect(() => parse('@render row(count = 1)')).toThrow('Assignment');
  });

  it('throws for a spread argument, pointing to it', () => {
    const template = '@render row(...pair())';
    expect(() => parse(template)).toThrow('@render passes each argument to its parameter: spread the values in separate arguments, e.g. @render row(pair()[0], pair()[1])');
    expect(() => parse(template)).toThrow(expect.objectContaining({ span: { start: template.indexOf('...'), end: template.length - 1 } }));
  });
});
