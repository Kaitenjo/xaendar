import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { InterpolationExpressionToken } from '../../../lexer/types/tokens/interpolation-expression-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNodeType } from '../../types/node.enum';
import { parseInterpolation } from './parse-interpolation.state';

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
});
