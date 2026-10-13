import { describe, expect, it } from 'vitest';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { line } from '../line-builder/line-builder.utils';
import { mappedExpression } from './mapped-expression.utils';

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

    expect(line(mappedExpression(node, new TypeCheckContext(), span, '', { skipResolution: true })).text).toBe('item');
  });

  it('maps only the whole fragment when the offset of the expression is not known', () => {
    const { node } = validateExpression('user');

    expect(line(mappedExpression(node, new TypeCheckContext(), span)).mappings).toEqual([{ columnStart: 0, columnEnd: 9, original: span }]);
  });
});
