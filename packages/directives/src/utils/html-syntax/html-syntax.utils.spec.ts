import { describe, expect, it } from 'vitest';
import { isAsciiLetter, isWhitespace, toAsciiLowerCase } from './html-syntax.utils';

describe('isAsciiLetter', () => {
  it('tells the ASCII letters', () => {
    expect(['a', 'z', 'A', 'Z'].every(letter => isAsciiLetter(letter.charCodeAt(0)))).toBe(true);
    expect(['@', '[', '`', '{', '1', String.fromCharCode(0xe0)].some(character => isAsciiLetter(character.charCodeAt(0)))).toBe(false);
    expect(isAsciiLetter(NaN)).toBe(false);
  });
});

describe('isWhitespace', () => {
  it('tells the white spaces of HTML: tab, line feed, form feed, carriage return and space', () => {
    expect([9, 10, 12, 13, 32].every(isWhitespace)).toBe(true);
    expect([0, 11, 160].some(isWhitespace)).toBe(false);
  });
});

describe('toAsciiLowerCase', () => {
  it('lowercases the ASCII letters only', () => {
    const kelvin = String.fromCharCode(0x212a);

    expect(toAsciiLowerCase('ViewBox')).toBe('viewbox');
    expect(toAsciiLowerCase(`MAR${kelvin}`)).toBe(`mar${kelvin}`);
  });
});
