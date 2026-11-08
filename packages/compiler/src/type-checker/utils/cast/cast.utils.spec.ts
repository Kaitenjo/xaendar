import { describe, expect, it } from 'vitest';
import { validateExpression } from '../../../parser/utils/expression-validator/expression-validator';
import type { LineMapping } from '../../types/line-mapping.type';
import { castExpression } from './cast.utils';

describe('castExpression', () => {
  it('casts the whole expression, parenthesized, to the type written as is', () => {
    const { node } = validateExpression('a ?? b');

    expect(castExpression(node, 'root.a ?? root.b', [], { text: 'Map<string, number>', span: { start: 0, end: 19 } })).toBe('((root.a ?? root.b) as Map<string, number>)');
  });

  it('moves the mappings of the expression past the parentheses, and maps the cast and the type onto the template', () => {
    // `{ value() as string }`
    const { node } = validateExpression('value()', 2);
    const segments: LineMapping[] = [{ columnStart: 5, columnEnd: 10, original: { start: 2, end: 7 } }];

    const text = castExpression(node, 'root.value()', segments, { text: 'string', span: { start: 13, end: 19 } });

    expect(segments).toEqual([
      { columnStart: 7, columnEnd: 12, original: { start: 2, end: 7 } },
      { columnStart: 1, columnEnd: 25, original: { start: 2, end: 19 } },
      { columnStart: 19, columnEnd: 25, original: { start: 13, end: 19 } }
    ]);
    expect(text.slice(7, 12)).toBe('value');
    expect(text.slice(1, 25)).toBe('(root.value()) as string');
    expect(text.slice(19, 25)).toBe('string');
  });

  it('maps only the type when the offset of the expression is not known', () => {
    const segments = new Array<LineMapping>();

    castExpression(validateExpression('value').node, 'root.value', segments, { text: 'string', span: { start: 12, end: 18 } });

    expect(segments).toEqual([{ columnStart: 17, columnEnd: 23, original: { start: 12, end: 18 } }]);
  });
});
