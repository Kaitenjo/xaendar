import { describe, expect, it } from 'vitest';
import { email, max, maxLength, min, minLength, pattern, required, requiredTrue } from './validators.utils';

/**
 * Gives the value a validator checks, as a signal would.
 */
function of(value: unknown): () => unknown {
  return () => value;
}

describe('Validators', () => {
  describe('required', () => {
    it.each([[null], [undefined], [''], [[]], [new Set()], [new Map()]])('finds %j missing', value => {
      expect(required(of(value))()).toEqual({ valueMissing: 'This field is required.' });
    });

    it.each([['a'], [' '], [0], [false], [[0]], [new Set([1])], [{}]])('finds %j present', value => {
      expect(required(of(value))()).toBeUndefined();
    });

    it('gives the message it is asked for, reading the value at each call', () => {
      let current: unknown = 'a';
      const validator = required(() => current, 'Fill it.');

      expect(validator()).toBeUndefined();
      current = '';
      expect(validator()).toEqual({ valueMissing: 'Fill it.' });
    });
  });

  describe('requiredTrue', () => {
    it('accepts only true', () => {
      expect(requiredTrue(of(true))()).toBeUndefined();
      expect(requiredTrue(of(false))()).toEqual({ valueMissing: 'This field must be checked.' });
      expect(requiredTrue(of('true'), 'Accept.')()).toEqual({ valueMissing: 'Accept.' });
    });
  });

  describe('minLength and maxLength', () => {
    it('finds a text or a list too short, an empty or a lengthless value passing', () => {
      expect(minLength(of('ab'), 3)()).toEqual({ tooShort: 'The length must be at least 3.' });
      expect(minLength(of([1]), 2, 'Short.')()).toEqual({ tooShort: 'Short.' });
      expect(minLength(of('abc'), 3)()).toBeUndefined();
      expect(minLength(of(''), 3)()).toBeUndefined();
      expect(minLength(of(null), 3)()).toBeUndefined();
      expect(minLength(of(5), 3)()).toBeUndefined();
    });

    it('finds a text or a list too long, a lengthless value passing', () => {
      expect(maxLength(of('abcd'), 3)()).toEqual({ tooLong: 'The length must be at most 3.' });
      expect(maxLength(of([1, 2]), 1, 'Long.')()).toEqual({ tooLong: 'Long.' });
      expect(maxLength(of('abc'), 3)()).toBeUndefined();
      expect(maxLength(of(undefined), 3)()).toBeUndefined();
      expect(maxLength(of(5), 3)()).toBeUndefined();
    });

    it('follows a limit given by a function', () => {
      let limit = 3;
      const validator = maxLength(of('abcd'), () => limit);

      expect(validator()).toEqual({ tooLong: 'The length must be at most 3.' });
      limit = 4;
      expect(validator()).toBeUndefined();
    });
  });

  describe('min and max', () => {
    it('finds a number below the minimum, the empty and the not numbers passing', () => {
      expect(min(of(1), 2)()).toEqual({ rangeUnderflow: 'The value must be at least 2.' });
      expect(min(of('1.5'), 2, 'Low.')()).toEqual({ rangeUnderflow: 'Low.' });
      expect(min(of(2), 2)()).toBeUndefined();
      expect(min(of(''), 2)()).toBeUndefined();
      expect(min(of(null), 2)()).toBeUndefined();
      expect(min(of('abc'), 2)()).toBeUndefined();
    });

    it('finds a number above the maximum, the empty and the not numbers passing', () => {
      expect(max(of(3), 2)()).toEqual({ rangeOverflow: 'The value must be at most 2.' });
      expect(max(of('2.5'), 2, 'High.')()).toEqual({ rangeOverflow: 'High.' });
      expect(max(of(2), 2)()).toBeUndefined();
      expect(max(of(undefined), 2)()).toBeUndefined();
      expect(max(of('abc'), 2)()).toBeUndefined();
    });

    it('follows a limit given by a function', () => {
      let limit = 5;
      const validator = min(of(3), () => limit);

      expect(validator()).toEqual({ rangeUnderflow: 'The value must be at least 5.' });
      limit = 3;
      expect(validator()).toBeUndefined();
    });
  });

  describe('pattern', () => {
    it('matches a text pattern against the whole value', () => {
      expect(pattern(of('abc'), '[a-z]+')()).toBeUndefined();
      expect(pattern(of('abc1'), '[a-z]+')()).toEqual({ patternMismatch: 'The value does not match the expected format.' });
      expect(pattern(of('ab'), 'a|ab')()).toBeUndefined();
    });

    it('uses a regular expression as it is, a global one giving the same answer each time', () => {
      const digits = /\d/g;
      const validator = pattern(of('a1'), digits, 'Digits.');

      expect(validator()).toBeUndefined();
      expect(validator()).toBeUndefined();
      expect(pattern(of('abc'), /\d/, 'Digits.')()).toEqual({ patternMismatch: 'Digits.' });
    });

    it('lets an empty value pass, and follows a pattern given by a function', () => {
      expect(pattern(of(''), '[a-z]+')()).toBeUndefined();
      expect(pattern(of(null), /a/)()).toBeUndefined();

      let current = 'a';
      const validator = pattern(of('b'), () => current);
      expect(validator()).toEqual({ patternMismatch: 'The value does not match the expected format.' });
      current = 'b';
      expect(validator()).toBeUndefined();
    });
  });

  describe('email', () => {
    it.each([['user@example.com'], ['first.last+tag@sub.example.org'], ['a@b']])('accepts %s', value => {
      expect(email(of(value))()).toBeUndefined();
    });

    it.each([['user'], ['@example.com'], ['user@'], ['user@@example.com'], ['us er@example.com'], ['user@-example.com']])('refuses %s', value => {
      expect(email(of(value))()).toEqual({ typeMismatch: 'Enter a valid email address.' });
    });

    it('lets an empty value pass, and gives the message it is asked for', () => {
      expect(email(of(''))()).toBeUndefined();
      expect(email(of(undefined))()).toBeUndefined();
      expect(email(of('x'), 'Email.')()).toEqual({ typeMismatch: 'Email.' });
    });
  });
});
