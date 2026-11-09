import { describe, expect, it } from 'vitest';
import type { SmallSet } from '../../types/small-set.type';
import { addToSmallSet, deleteFromSmallSet, emptySmallSet, smallSetHas, smallSetSize } from './small-set.util';

/**
 * Adds the items to an empty `SmallSet`, one by one.
 */
const fill = <T>(items: T[]): SmallSet<T> => items.reduce((set, item) => addToSmallSet(set, item), emptySmallSet<T>());

/**
 * The numbers from 0 to `count - 1`.
 */
const range = (count: number) => Array.from({ length: count }, (_, i) => i);

describe('SmallSet', () => {
  describe('emptySmallSet', () => {
    it('returns one shared frozen empty array', () => {
      const set = emptySmallSet<number>();

      expect(set).toEqual([]);
      expect(Object.isFrozen(set)).toBe(true);
      expect(emptySmallSet<string>()).toBe(set);
      expect(emptySmallSet<string>(32)).toBe(set);
    });

    it('returns a new Set when expected to hold more items than an array keeps', () => {
      const set = emptySmallSet<number>(33);

      expect(set).toBeInstanceOf(Set);
      expect(emptySmallSet<number>(33)).not.toBe(set);
      expect([...addToSmallSet(addToSmallSet(set, 2), 1)]).toEqual([2, 1]);
    });
  });

  describe('addToSmallSet', () => {
    it('makes an array of its own for the first item, leaving the shared empty one untouched', () => {
      const empty = emptySmallSet<number>();
      const set = addToSmallSet(empty, 1);

      expect(set).toEqual([1]);
      expect(set).not.toBe(empty);
      expect(empty).toEqual([]);
    });

    it('pushes the next items into the same array, in insertion order', () => {
      const set = addToSmallSet(emptySmallSet<number>(), 3);

      expect(addToSmallSet(set, 1)).toBe(set);
      expect(addToSmallSet(set, 2)).toBe(set);
      expect([...set]).toEqual([3, 1, 2]);
    });

    it('ignores an item it holds already, in an array and in a Set', () => {
      const array = fill([1, 2]);
      expect(addToSmallSet(array, 1)).toBe(array);
      expect([...array]).toEqual([1, 2]);

      const set = fill(range(40));
      expect(addToSmallSet(set, 5)).toBe(set);
      expect(smallSetSize(set)).toBe(40);
    });

    it('keeps 32 items in an array, and moves them to a Set with the 33rd, in insertion order', () => {
      const items = range(33).reverse();
      const array = fill(items.slice(0, 32));
      expect(Array.isArray(array)).toBe(true);

      const set = addToSmallSet(array, items[32]);
      expect(set).toBeInstanceOf(Set);
      expect([...set]).toEqual(items);
      expect(addToSmallSet(set, 100)).toBe(set);
      expect([...set].at(-1)).toBe(100);
    });
  });

  describe('deleteFromSmallSet', () => {
    it('removes an item in place, keeping the order of the others', () => {
      const set = fill([1, 2, 3, 4]);

      expect(deleteFromSmallSet(set, 2)).toBe(set);
      expect([...set]).toEqual([1, 3, 4]);
      expect([...addToSmallSet(set, 2)]).toEqual([1, 3, 4, 2]);
    });

    it('leaves the set untouched when it does not hold the item', () => {
      const array = fill([1, 2]);
      expect(deleteFromSmallSet(array, 3)).toBe(array);
      expect([...array]).toEqual([1, 2]);

      expect(deleteFromSmallSet(emptySmallSet<number>(), 3)).toBe(emptySmallSet());
    });

    it('returns the shared empty array once the last item is removed', () => {
      expect(deleteFromSmallSet(fill([1]), 1)).toBe(emptySmallSet());
    });

    it('removes NaN, as a Set does', () => {
      expect([...deleteFromSmallSet(fill([1, NaN, 2]), NaN)]).toEqual([1, 2]);
    });

    it('keeps a Set once the items decrease, in insertion order', () => {
      const set = fill(range(33));
      for (let i = 0; i < 32; i++) {
        expect(deleteFromSmallSet(set, i)).toBe(set);
      }

      expect(set).toBeInstanceOf(Set);
      expect([...set]).toEqual([32]);
    });
  });

  describe('smallSetHas and smallSetSize', () => {
    it('read an empty set, an array and a Set', () => {
      const empty = emptySmallSet<number>();
      const array = fill([1, NaN]);
      const set = fill(range(40));

      expect([smallSetSize(empty), smallSetSize(array), smallSetSize(set)]).toEqual([0, 2, 40]);
      expect([smallSetHas(empty, 1), smallSetHas(array, 1), smallSetHas(array, NaN), smallSetHas(array, 2)]).toEqual([false, true, true, false]);
      expect([smallSetHas(set, 39), smallSetHas(set, 40)]).toEqual([true, false]);
    });
  });
});
