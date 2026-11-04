import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { InterpolationExpressionToken } from '../../../lexer/types/tokens/interpolation-expression-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNodeType } from '../../types/node.enum';
import { parseInterpolation } from './parse-interpolation.state';
import { Parser } from '../../parser/parser';
import type { ElementNode } from '../../types/nodes/element-node.type';
import type { InterpolationNode } from '../../types/nodes/interpolation-node.type';
import { getTemplateSpan } from '../../utils/expression-validator/expression-validator';

const run = (template: string) => {
  const cursor = new ParserCursor(template, new Lexer(template).tokenize());
  return parseInterpolation(cursor, () => undefined, cursor.peek() as InterpolationExpressionToken);
};

describe('parseInterpolation', () => {
  it('parses an expression interpolation', () => {
    const node = run('{ value }');
    expect(node.type).toBe(ASTNodeType.Interpolation);
    expect(node.expression.getText()).toBe('value');
  });

  it('parses a template literal interpolation', () => {
    expect(run('{`a ${b}`}').expression.getText()).toBe('`a ${b}`');
  });

  it('throws for a disallowed expression', () => {
    expect(() => run('{ a = 1 }')).toThrow();
  });

  it('locates the expression in the template', () => {
    const template = '<a>{  user.name }</a>';
    const [node] = new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[];
    const [interpolation] = node.children as InterpolationNode[];

    expect(getTemplateSpan(interpolation.expression)).toEqual({ start: 6, end: 15 });
  });
});
