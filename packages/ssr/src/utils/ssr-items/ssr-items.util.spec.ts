import { describe, expect, it } from 'vitest';
import { _ssrItems } from './ssr-items.util';

describe('_ssrItems', () => {
  it('iterates the items of an array', () => {
    const items = ['a', 'b'];

    expect(_ssrItems(items)).toBe(items);
  });

  it('iterates 0, 1, …, n - 1 for a number n', () => {
    expect(_ssrItems(3)).toEqual([0, 1, 2]);
    expect(_ssrItems(0)).toEqual([]);
  });
});
