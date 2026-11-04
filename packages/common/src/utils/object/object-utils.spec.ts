import { describe, expect, expectTypeOf, it } from 'vitest';
import { entries, isEmpty, isNonEmpty, keys, values } from './object-utils';

describe('Object Utils', () => {
  describe('isNonEmpty', () => {
    it('should return true for object with properties', () => {
      const obj = { a: 1 };
      expect(isNonEmpty(obj)).toBe(true);
    });

    it('should return false for empty object', () => {
      const obj = {};
      expect(isNonEmpty(obj)).toBe(false);
    });

    it('should narrow type to NonEmptyObject', () => {
      const obj: object = { a: 1 };
      if (isNonEmpty(obj)) {
        // obj should be NonEmptyObject here
        expect(obj).toHaveProperty('a');
      }
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty object', () => {
      const obj = {};
      expect(isEmpty(obj)).toBe(true);
    });

    it('should return false for object with properties', () => {
      const obj = { a: 1 };
      expect(isEmpty(obj)).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return array of keys', () => {
      const obj = { a: 1, b: 2 };
      const result = keys(obj);
      expect(result).toEqual(['a', 'b']);
    });

    it('should return empty array for empty object', () => {
      const obj = {};
      const result = keys(obj);
      expect(result).toEqual([]);
    });

    it('should return undefined for undefined input', () => {
      const result = keys(undefined);
      expect(result).toBeUndefined();
    });

    it('should maintain key types', () => {
      const obj = { a: 1, b: 'test' };
      const result = keys(obj);
      expectTypeOf(result).toEqualTypeOf<('a' | 'b')[]>();
      expect(result).toContain('a');
      expect(result).toContain('b');
    });

    it('should type numeric keys as strings, as they are returned', () => {
      const result = keys({ 1: 'one' });
      expectTypeOf(result).toEqualTypeOf<'1'[]>();
      expect(result).toEqual(['1']);
    });

    it('should accept an object that may be undefined', () => {
      const obj = { a: 1 } as { a: number } | undefined;
      const result = keys(obj);
      expectTypeOf(result).toEqualTypeOf<'a'[] | undefined>();
      expect(result).toEqual(['a']);
    });
  });

  describe('entries', () => {
    it('should return array of key-value pairs', () => {
      const obj = { a: 1, b: 2 };
      const result = entries(obj);
      expect(result).toEqual([['a', 1], ['b', 2]]);
    });

    it('should return empty array for empty object', () => {
      const obj = {};
      const result = entries(obj);
      expect(result).toEqual([]);
    });

    it('should return undefined for undefined input', () => {
      const result = entries(undefined);
      expect(result).toBeUndefined();
    });

    it('should type the keys as strings, and accept an object that may be undefined', () => {
      const obj = { 1: 'one', b: 2 } as { 1: string, b: number } | undefined;
      const result = entries(obj);
      expectTypeOf(result).toEqualTypeOf<['1' | 'b', string | number][] | undefined>();
      expect(result).toEqual([['1', 'one'], ['b', 2]]);
    });
  });

  describe('values', () => {
    it('should return array of values', () => {
      const obj = { a: 1, b: 2 };
      const result = values(obj);
      expect(result).toEqual([1, 2]);
    });

    it('should return empty array for empty object', () => {
      const obj = {};
      const result = values(obj);
      expect(result).toEqual([]);
    });

    it('should return undefined for undefined input', () => {
      const result = values(undefined);
      expect(result).toBeUndefined();
    });

    it('should accept an object that may be undefined', () => {
      const obj = { a: 1, b: 'x' } as { a: number, b: string } | undefined;
      const result = values(obj);
      expectTypeOf(result).toEqualTypeOf<(string | number)[] | undefined>();
      expect(result).toEqual([1, 'x']);
    });
  });
});
