import { describe, expect, it } from 'vitest';
import { indentLines, line, mapped, plain } from './line-builder.utils';

describe('line-builder utils', () => {
  const span = { start: 1, end: 4 };

  it('marks a fragment as mapped', () => {
    expect(mapped('abc', span)).toEqual({ text: 'abc', span });
  });

  it('builds a plain line', () => {
    expect(plain('x')).toEqual({ text: 'x' });
  });

  it('composes a line of static parts without mappings', () => {
    expect(line('a', 'b')).toEqual({ text: 'ab' });
  });

  it('computes mapping columns from the accumulated text', () => {
    expect(line('if (', mapped('cond', span), ') {', mapped('x', span))).toEqual({
      text: 'if (cond) {x',
      mappings: [
        { columnStart: 4, columnEnd: 8, original: span },
        { columnStart: 11, columnEnd: 12, original: span }
      ]
    });
  });

  it('indents lines and shifts their mappings', () => {
    const lines = indentLines([plain('a'), line(mapped('b', span))]);

    expect(lines[0]).toEqual({ text: '  a', mappings: undefined });
    expect(lines[1]).toEqual({
      text: '  b',
      mappings: [{ columnStart: 2, columnEnd: 3, original: span }]
    });
  });
});
