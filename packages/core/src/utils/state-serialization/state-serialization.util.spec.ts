import { describe, expect, it } from 'vitest';
import { _parseState, _stringifyState } from './state-serialization.util';

/**
 * Writes a value and reads it back.
 *
 * @param value - The value.
 * @returns The value read back.
 */
function roundTrip(value: unknown): unknown {
  return _parseState(_stringifyState(value, 'value'));
}

describe('_stringifyState() and _parseState()', () => {
  it('write the values JSON holds as JSON', () => {
    const value = { name: 'Ada', age: 36, admin: true, manager: null, tags: ['a', 'b'] };

    expect(_stringifyState(value, 'value')).toBe(JSON.stringify(value));
    expect(roundTrip(value)).toEqual(value);
  });

  it('read back undefined, the numbers JSON lacks and a bigint', () => {
    const value = roundTrip([undefined, NaN, Infinity, -Infinity, -0, 0, 12n]) as unknown[];

    expect(value).toHaveLength(7);
    expect(value[0]).toBeUndefined();
    expect(value[1]).toBeNaN();
    expect(value[2]).toBe(Infinity);
    expect(value[3]).toBe(-Infinity);
    expect(Object.is(value[4], -0)).toBe(true);
    expect(Object.is(value[5], 0)).toBe(true);
    expect(value[6]).toBe(12n);
  });

  it('read back the holes of an array as undefined', () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(roundTrip([1, , 3])).toEqual([1, undefined, 3]);
  });

  it('read back a Date, an invalid one included', () => {
    const value = roundTrip({ valid: new Date(Date.UTC(2026, 9, 31)), invalid: new Date(NaN) }) as { valid: Date, invalid: Date };

    expect(value.valid).toBeInstanceOf(Date);
    expect(value.valid.toISOString()).toBe('2026-10-31T00:00:00.000Z');
    expect(value.invalid.getTime()).toBeNaN();
  });

  it('read back a Map and a Set, with the values they hold', () => {
    const value = roundTrip({ map: new Map<unknown, unknown>([[1, new Set(['a'])], ['key', undefined]]), set: new Set([new Date(0)]) }) as { map: Map<unknown, unknown>, set: Set<Date> };

    expect(value.map).toEqual(new Map<unknown, unknown>([[1, new Set(['a'])], ['key', undefined]]));
    expect([...value.set][0]).toEqual(new Date(0));
  });

  it('read back a plain object as such, its keys starting with $ and a property named __proto__ included', () => {
    const value = JSON.parse('{"$":"undefined","$$x":1,"__proto__":{"polluted":true}}') as Record<string, unknown>;
    const read = roundTrip(value) as Record<string, unknown>;

    expect(read).toEqual(value);
    expect(Object.getPrototypeOf(read)).toBe(Object.prototype);
    expect(Object.hasOwn(read, '__proto__')).toBe(true);
    expect(roundTrip(Object.assign(Object.create(null), { name: 'Ada' }))).toEqual({ name: 'Ada' });
  });

  it('writes an object referenced twice twice', () => {
    const shared = { id: 1 };

    expect(roundTrip({ first: shared, second: shared })).toEqual({ first: { id: 1 }, second: { id: 1 } });
  });

  it('throws for a function or a symbol, naming where it is', () => {
    expect(() => _stringifyState({ product: { onSave: () => undefined } }, 'inputs')).toThrow('inputs.product.onSave is a function, which cannot be written into the HTML: pass the data it is built from, and build it in the component');
    expect(() => _stringifyState({ 'first name': [Symbol('a')] }, 'state')).toThrow('state["first name"][0] is a symbol, which cannot be written into the HTML');
  });

  it('throws for an instance of a class, naming it', () => {
    class Money {}

    expect(() => _stringifyState({ price: new Money() }, 'inputs')).toThrow('inputs.price is an instance of Money, which cannot be written into the HTML: pass a plain object, an array, a Date, a Map or a Set');
    expect(() => _stringifyState(Object.create(Object.create(null)), 'state')).toThrow('state is an instance of a class, which cannot be written into the HTML');
  });

  it('names the keys and the values of a Map and the items of a Set', () => {
    expect(() => _stringifyState(new Map([[() => undefined, 1]]), 'state')).toThrow('state.keys()[0] is a function');
    expect(() => _stringifyState(new Map([['save', () => undefined]]), 'state')).toThrow('state.get(save) is a function');
    expect(() => _stringifyState(new Set([1, () => undefined]), 'state')).toThrow('state.values()[1] is a function');
  });

  it('throws for an object containing itself', () => {
    const node: Record<string, unknown> = { name: 'root' };
    node.children = [node];

    expect(() => _stringifyState(node, 'inputs')).toThrow('inputs.children[0] contains itself, which cannot be written into the HTML');
  });
});
