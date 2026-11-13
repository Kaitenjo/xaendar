import { describe, expect, it } from 'vitest';
import { _forItems } from './for-items.util';

describe('_forItems', () => {
  it('reads an array as it is', () => {
    const items = ['a', 'b'];
    expect(_forItems(items)).toBe(items);
  });

  it('reads a number as the numbers from 0 to it, excluded', () => {
    expect(_forItems(3)).toEqual([0, 1, 2]);
    expect(_forItems(0)).toEqual([]);
  });

  it('reads the values of an iterable: the entries of a Map, the values of a Set, the ones a generator yields', () => {
    expect(_forItems(new Map([['a', 1], ['b', 2]]))).toEqual([['a', 1], ['b', 2]]);
    expect(_forItems(new Set(['x', 'y']))).toEqual(['x', 'y']);
    expect(_forItems((function* () {
      yield 1;
      yield 2;
    })())).toEqual([1, 2]);
  });

  it.each([
    ['a string', 'abc', 'a string'],
    ['null', null, 'null'],
    ['undefined', undefined, 'undefined'],
    ['an object', { length: 2 }, 'an object'],
    ['a boolean', true, 'a boolean']
  ])('throws for %s', (_description, value, described) => {
    expect(() => _forItems(value)).toThrow(new TypeError(`@for iterates an array, a number or an iterable (a Map, a Set…), not ${described}`));
  });
});
