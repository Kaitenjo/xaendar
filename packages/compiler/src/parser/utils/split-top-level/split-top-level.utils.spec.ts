import { describe, expect, it } from 'vitest';
import { splitTopLevel } from './split-top-level.utils';

describe('splitTopLevel', () => {
  it('splits on the commas outside of parentheses, brackets, braces and string literals, trimming each part', () => {
    const source = ' a, f(b, c), [d, e], { f: 1, g: 2 }, \'h, i\', "j\\", k", `l, m`';
    const parts = splitTopLevel(source);

    expect(parts.map(({ text }) => text)).toEqual(['a', 'f(b, c)', '[d, e]', '{ f: 1, g: 2 }', '\'h, i\'', '"j\\", k"', '`l, m`']);
    expect(parts.every(({ text, start }) => source.startsWith(text, start))).toBe(true);
  });

  it('returns an empty part for an empty text', () => {
    expect(splitTopLevel('')).toEqual([{ text: '', start: 0 }]);
  });
});
