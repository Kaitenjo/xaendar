import { describe, expect, it } from 'vitest';
import { removeItem } from './array.util';

describe('removeItem', () => {
  it('removes the first occurrence of the item and returns true', () => {
    const array = [1, 2, 3, 2];

    expect(removeItem(array, 2)).toBe(true);
    expect(array).toEqual([1, 3, 2]);
  });

  it('leaves the array untouched and returns false when the item is missing', () => {
    const array = [1, 2, 3];

    expect(removeItem(array, 4)).toBe(false);
    expect(array).toEqual([1, 2, 3]);
  });

  it('does not extend Array.prototype', () => {
    expect('removeItem' in Array.prototype).toBe(false);
  });
});
