import { describe, expect, it } from 'vitest';
import { email, max, maxLength, min, minLength, pattern, required, requiredTrue } from './validators.utils';

describe('validators', () => {
  describe('required', () => {
    it.each([[null], [undefined], [''], [[]], [new Set()], [new Map()]])('finds %j missing', value => {
      expect(required()(value)).toEqual({ valueMissing: 'This field is required.' });
    });

    it.each([['a'], [' '], [0], [false], [[0]], [new Set([1])], [{}]])('finds %j present', value => {
      expect(required()(value)).toBeUndefined();
    });

    it('gives the message it is asked for', () => {
      expect(required('Fill it.')('')).toEqual({ valueMissing: 'Fill it.' });
    });
  });

  describe('requiredTrue', () => {
    it('accepts only true', () => {
      expect(requiredTrue()(true)).toBeUndefined();
      expect(requiredTrue()(false)).toEqual({ valueMissing: 'This field must be checked.' });
      expect(requiredTrue('Accept.')('true')).toEqual({ valueMissing: 'Accept.' });
    });
  });

  describe('minLength and maxLength', () => {
    it('finds a text or a list too short, an empty or a lengthless value passing', () => {
      expect(minLength(3)('ab')).toEqual({ tooShort: 'The length must be at least 3.' });
      expect(minLength(2, 'Short.')([1])).toEqual({ tooShort: 'Short.' });
      expect(minLength(3)('abc')).toBeUndefined();
      expect(minLength(3)('')).toBeUndefined();
      expect(minLength(3)(null)).toBeUndefined();
      expect(minLength(3)(5)).toBeUndefined();
    });

    it('finds a text or a list too long, a lengthless value passing', () => {
      expect(maxLength(3)('abcd')).toEqual({ tooLong: 'The length must be at most 3.' });
      expect(maxLength(1, 'Long.')([1, 2])).toEqual({ tooLong: 'Long.' });
      expect(maxLength(3)('abc')).toBeUndefined();
      expect(maxLength(3)(undefined)).toBeUndefined();
      expect(maxLength(3)(5)).toBeUndefined();
    });

    it('follows a limit given by a function', () => {
      let limit = 3;
      const validator = maxLength(() => limit);

      expect(validator('abcd')).toEqual({ tooLong: 'The length must be at most 3.' });
      limit = 4;
      expect(validator('abcd')).toBeUndefined();
    });
  });

  describe('min and max', () => {
    it('finds a number below the minimum, the empty and the not numbers passing', () => {
      expect(min(2)(1)).toEqual({ rangeUnderflow: 'The value must be at least 2.' });
      expect(min(2, 'Low.')('1.5')).toEqual({ rangeUnderflow: 'Low.' });
      expect(min(2)(2)).toBeUndefined();
      expect(min(2)('')).toBeUndefined();
      expect(min(2)(null)).toBeUndefined();
      expect(min(2)('abc')).toBeUndefined();
    });

    it('finds a number above the maximum, the empty and the not numbers passing', () => {
      expect(max(2)(3)).toEqual({ rangeOverflow: 'The value must be at most 2.' });
      expect(max(2, 'High.')('2.5')).toEqual({ rangeOverflow: 'High.' });
      expect(max(2)(2)).toBeUndefined();
      expect(max(2)(undefined)).toBeUndefined();
      expect(max(2)('abc')).toBeUndefined();
    });

    it('follows a limit given by a function', () => {
      let limit = 5;
      const validator = min(() => limit);

      expect(validator(3)).toEqual({ rangeUnderflow: 'The value must be at least 5.' });
      limit = 3;
      expect(validator(3)).toBeUndefined();
    });
  });

  describe('pattern', () => {
    it('matches a text pattern against the whole value', () => {
      expect(pattern('[a-z]+')('abc')).toBeUndefined();
      expect(pattern('[a-z]+')('abc1')).toEqual({ patternMismatch: 'The value does not match the expected format.' });
      expect(pattern('a|ab')('ab')).toBeUndefined();
    });

    it('uses a regular expression as it is, a global one giving the same answer each time', () => {
      const validator = pattern(/\d/g, 'Digits.');

      expect(validator('a1')).toBeUndefined();
      expect(validator('a1')).toBeUndefined();
      expect(pattern(/\d/, 'Digits.')('abc')).toEqual({ patternMismatch: 'Digits.' });
    });

    it('lets an empty value pass, and follows a pattern given by a function', () => {
      expect(pattern('[a-z]+')('')).toBeUndefined();
      expect(pattern(/a/)(null)).toBeUndefined();

      let current = 'a';
      const validator = pattern(() => current);
      expect(validator('b')).toEqual({ patternMismatch: 'The value does not match the expected format.' });
      current = 'b';
      expect(validator('b')).toBeUndefined();
    });
  });

  describe('email', () => {
    it.each([['user@example.com'], ['first.last+tag@sub.example.org'], ['a@b']])('accepts %s', value => {
      expect(email()(value)).toBeUndefined();
    });

    it.each([['user'], ['@example.com'], ['user@'], ['user@@example.com'], ['us er@example.com'], ['user@-example.com']])('refuses %s', value => {
      expect(email()(value)).toEqual({ typeMismatch: 'Enter a valid email address.' });
    });

    it('lets an empty value pass, and gives the message it is asked for', () => {
      expect(email()('')).toBeUndefined();
      expect(email()(undefined)).toBeUndefined();
      expect(email('Email.')('x')).toEqual({ typeMismatch: 'Email.' });
    });
  });
});
