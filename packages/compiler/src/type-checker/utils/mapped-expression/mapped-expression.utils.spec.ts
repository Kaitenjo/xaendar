import { describe, expect, it } from 'vitest';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import { TypeCheckContext } from '../../models/context/context';
import { line } from '../line-builder/line-builder.utils';
import { ASTNodeType } from '../../../parser/types/node.enum';
import type { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { mappedExpression, mappedInterpolation } from './mapped-expression.utils';

describe('mappedExpression', () => {
  const span = { start: 0, end: 20 };

  it('maps the whole fragment and, finely, the identifiers and the verbatim pieces of the expression', () => {
    // `{ user.name + 1 }`: the expression starts at offset 2
    const { node } = validateExpression('user.name + 1', 2);

    const { text, mappings } = line(mappedExpression(node, new TypeCheckContext(), span, ';'));
    const [whole, ...segments] = mappings!;

    expect(text).toBe('root.user.name + 1;');
    expect(whole).toEqual({ columnStart: 0, columnEnd: 19, original: span });
    // The resolved identifier: `user` in `root.user`
    expect(segments).toContainEqual({ columnStart: 5, columnEnd: 9, original: { start: 2, end: 6 } });
    // The pieces copied verbatim: the name of the member and the literal
    expect(segments).toContainEqual({ columnStart: 10, columnEnd: 14, original: { start: 7, end: 11 } });
    expect(segments).toContainEqual({ columnStart: 17, columnEnd: 18, original: { start: 14, end: 15 } });
    // Every finer mapping covers as many columns as characters of the template
    expect(segments.every(({ columnStart, columnEnd, original }) => columnEnd - columnStart === original.end - original.start)).toBe(true);
  });

  it('resolves the expression with the given options', () => {
    const { node } = validateExpression('item', 0);

    expect(line(mappedExpression(node, new TypeCheckContext(), span, '', { resolver: '' })).text).toBe('item');
  });

  it('maps only the whole fragment when the offset of the expression is not known', () => {
    const { node } = validateExpression('user');

    expect(line(mappedExpression(node, new TypeCheckContext(), span)).mappings).toEqual([{ columnStart: 0, columnEnd: 9, original: span }]);
  });
});

describe('mappedInterpolation', () => {
  const interpolation = (template: string, expression: string, cast?: string): InterpolationNode => {
    const node: InterpolationNode = { type: ASTNodeType.Interpolation, expression: validateExpression(expression, template.indexOf(expression)).node, span: { start: 0, end: template.length } };
    if (cast) {
      node.cast = { text: cast, span: { start: template.indexOf(cast), end: template.indexOf(cast) + cast.length } };
    }

    return node;
  };

  it('resolves the expression of an interpolation, mapped onto the span of the interpolation', () => {
    const template = '{ user }';
    const { text, mappings } = line(mappedInterpolation(interpolation(template, 'user'), new TypeCheckContext(), ';'));

    expect(text).toBe('root.user;');
    expect(mappings).toContainEqual({ columnStart: 0, columnEnd: 10, original: { start: 0, end: template.length } });
    expect(mappings).toContainEqual({ columnStart: 5, columnEnd: 9, original: { start: 2, end: 6 } });
  });

  it('casts the expression to the type of its cast, mapped onto the type', () => {
    const template = '{ user as User }';
    const { text, mappings } = line(mappedInterpolation(interpolation(template, 'user', 'User'), new TypeCheckContext(), ';'));

    expect(text).toBe('((root.user) as User);');
    expect(mappings).toContainEqual({ columnStart: 7, columnEnd: 11, original: { start: 2, end: 6 } });
    expect(mappings).toContainEqual({ columnStart: 16, columnEnd: 20, original: { start: 10, end: 14 } });
  });
});
