import { describe, expect, it } from 'vitest';
import { findSpan, isSpan } from './span.utils';

describe('isSpan', () => {
  it.each([
    [{ start: 1, end: 2 }, true],
    [{ start: 1 }, false],
    [{}, false],
    ['span', false],
    [null, false],
    [undefined, false]
  ])('tells whether %j is a span', (value, expected) => {
    expect(isSpan(value)).toBe(expected);
  });
});

describe('findSpan', () => {
  it('finds the text from the given offset onwards', () => {
    expect(findSpan('<a title="x" title2="y">', 'title', 3)).toEqual({ start: 3, end: 8 });
    expect(findSpan('<a title="x" title2="y">', 'title', 4)).toEqual({ start: 13, end: 18 });
  });

  it('returns an empty span at the offset when the text is not found', () => {
    expect(findSpan('<a>', 'title', 1)).toEqual({ start: 1, end: 1 });
  });
});
