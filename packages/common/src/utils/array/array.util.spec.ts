import { describe, expect, it } from 'vitest';
import './array.util';

describe('Array.prototype.removeItem', () => {
  it('removes the first occurrence of the item and returns true', () => {
    const array = [1, 2, 3, 2];

    expect(array.removeItem(2)).toBe(true);
    expect(array).toEqual([1, 3, 2]);
  });

  it('leaves the array untouched and returns false when the item is missing', () => {
    const array = [1, 2, 3];

    expect(array.removeItem(4)).toBe(false);
    expect(array).toEqual([1, 2, 3]);
  });

  it('is not enumerable', () => {
    expect(Object.keys(Array.prototype)).not.toContain('removeItem');
  });
});
