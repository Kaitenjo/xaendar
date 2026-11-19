import { describe, expect, it, vi } from 'vitest';
import type { SmallSet } from '../../types/small-set.type';
import { addToSmallSet, deleteFromSmallSet, emptySmallSet, findInSmallSet, forEachInSmallSet, smallSetHas, smallSetSize, smallSetToArray } from './small-set.util';

/**
 * An item of the sets, an object as the nodes of the signals are.
 */
type Item = { readonly id: number };

/**
 * The items, by number, so that the specs name them by their number.
 */
const items = Array.from({ length: 50 }, (_, id): Item => ({ id }));

/**
 * Adds the items numbered to an empty `SmallSet`, one by one.
 */
const fill = (ids: number[]): SmallSet<Item> => ids.reduce((set, id) => addToSmallSet(set, items[id]), emptySmallSet<Item>());

/**
 * The numbers of the items of a `SmallSet`, in insertion order.
 */
const idsOf = (set: SmallSet<Item>) => smallSetToArray(set).map(item => item.id);

/**
 * The numbers from 0 to `count - 1`.
 */
const range = (count: number) => Array.from({ length: count }, (_, i) => i);

describe('SmallSet', () => {
  describe('emptySmallSet', () => {
    it('returns one shared frozen empty array', () => {
      const set = emptySmallSet<Item>();

      expect(set).toEqual([]);
      expect(Object.isFrozen(set)).toBe(true);
      expect(emptySmallSet<Item>()).toBe(set);
      expect(emptySmallSet<Item>(32)).toBe(set);
    });

    it('returns a new Set when expected to hold more items than an array keeps', () => {
      const set = emptySmallSet<Item>(33);

      expect(set).toBeInstanceOf(Set);
      expect(emptySmallSet<Item>(33)).not.toBe(set);
      expect(idsOf(addToSmallSet(addToSmallSet(set, items[2]), items[1]))).toEqual([2, 1]);
    });
  });

  describe('addToSmallSet', () => {
    it('keeps the first item as it is, leaving the shared empty array untouched', () => {
      const empty = emptySmallSet<Item>();

      expect(addToSmallSet(empty, items[1])).toBe(items[1]);
      expect(empty).toEqual([]);
    });

    it('makes an array of exactly the two items with the second one, then pushes the next ones into it, in insertion order', () => {
      const pair = addToSmallSet(items[3], items[1]) as Item[];
      expect(pair).toEqual([items[3], items[1]]);

      expect(addToSmallSet(pair, items[2])).toBe(pair);
      expect(idsOf(pair)).toEqual([3, 1, 2]);
    });

    it('ignores an item it holds already, alone, in an array and in a Set', () => {
      expect(addToSmallSet(items[1], items[1])).toBe(items[1]);

      const array = fill([1, 2]);
      expect(addToSmallSet(array, items[1])).toBe(array);
      expect(idsOf(array)).toEqual([1, 2]);

      const set = fill(range(40));
      expect(addToSmallSet(set, items[5])).toBe(set);
      expect(smallSetSize(set)).toBe(40);
    });

    it('keeps 32 items in an array, and moves them to a Set with the 33rd, in insertion order', () => {
      const ids = range(33).reverse();
      const array = fill(ids.slice(0, 32));
      expect(Array.isArray(array)).toBe(true);

      const set = addToSmallSet(array, items[ids[32]]);
      expect(set).toBeInstanceOf(Set);
      expect(idsOf(set)).toEqual(ids);
      expect(addToSmallSet(set, items[45])).toBe(set);
      expect(idsOf(set).at(-1)).toBe(45);
    });
  });

  describe('deleteFromSmallSet', () => {
    it('removes an item in place from an array of three or more, keeping the order of the others', () => {
      const set = fill([1, 2, 3, 4]);

      expect(deleteFromSmallSet(set, items[2])).toBe(set);
      expect(idsOf(set)).toEqual([1, 3, 4]);
      expect(idsOf(addToSmallSet(set, items[2]))).toEqual([1, 3, 4, 2]);
    });

    it('keeps the last item of an array of two as it is, then the shared empty array, down to empty', () => {
      const pair = fill([1, 2]);

      expect(deleteFromSmallSet(pair, items[1])).toBe(items[2]);
      expect(deleteFromSmallSet(fill([1, 2]), items[2])).toBe(items[1]);
      expect(deleteFromSmallSet(items[2], items[2])).toBe(emptySmallSet());
    });

    it('leaves the set untouched when it does not hold the item', () => {
      const array = fill([1, 2]);
      expect(deleteFromSmallSet(array, items[3])).toBe(array);
      expect(idsOf(array)).toEqual([1, 2]);

      expect(deleteFromSmallSet(items[1], items[3])).toBe(items[1]);
      expect(deleteFromSmallSet(emptySmallSet<Item>(), items[3])).toBe(emptySmallSet());
    });

    it('keeps a Set once the items decrease, in insertion order', () => {
      const set = fill(range(33));
      for (let i = 0; i < 32; i++) {
        expect(deleteFromSmallSet(set, items[i])).toBe(set);
      }

      expect(set).toBeInstanceOf(Set);
      expect(idsOf(set)).toEqual([32]);
    });
  });

  describe('reading', () => {
    it('tells the size and whether it holds an item, empty, alone, in an array and in a Set', () => {
      const sets = [emptySmallSet<Item>(), fill([1]), fill([1, 2]), fill([1, 2, 3]), fill(range(40))];

      expect(sets.map(set => smallSetSize(set))).toEqual([0, 1, 2, 3, 40]);
      expect(sets.map(set => smallSetHas(set, items[1]))).toEqual([false, true, true, true, true]);
      expect(sets.map(set => smallSetHas(set, items[45]))).toEqual([false, false, false, false, false]);
    });

    it('visits the items in insertion order, and copies them into a new array', () => {
      const sets = [emptySmallSet<Item>(), fill([1]), fill([2, 1]), fill([3, 1, 2]), fill(range(34).reverse())];
      for (let i = 0; i < sets.length; i++) {
        const visit = vi.fn();
        forEachInSmallSet(sets[i], visit, 'argument');

        expect(visit.mock.calls.map(([item, argument]) => [(item as Item).id, argument])).toEqual(idsOf(sets[i]).map(id => [id, 'argument']));
        expect(smallSetToArray(sets[i])).not.toBe(sets[i]);
      }

      expect(idsOf(fill([3, 1, 2]))).toEqual([3, 1, 2]);
    });

    it('finds the first item satisfying a predicate, alone, in an array and in a Set', () => {
      const even = (item: Item, offset: number) => (item.id + offset) % 2 === 0;
      const sets = [emptySmallSet<Item>(), fill([1]), fill([1, 2, 4]), fill(range(40).reverse())];

      expect(sets.map(set => findInSmallSet(set, even, 0)?.id)).toEqual([undefined, undefined, 2, 38]);
      expect(sets.map(set => findInSmallSet(set, even, 1)?.id)).toEqual([undefined, 1, 1, 39]);
      expect(findInSmallSet(fill([2, 4]), even, 1)).toBeUndefined();
      expect(findInSmallSet(addToSmallSet(emptySmallSet<Item>(33), items[2]), even, 1)).toBeUndefined();
    });
  });
});
