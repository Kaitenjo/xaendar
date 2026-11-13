import { describe, expect, it } from 'vitest';
import { keyOpinion, stringOpinions, toExactLength } from './styling-opinions.util';

describe('stringOpinions', () => {
  it('gives the classes of a class string, present, each once', () => {
    expect(stringOpinions('class', ' a b\ta ')).toEqual(['a', true, 'b', true]);
    expect(stringOpinions('class', 'one')).toEqual(['one', true]);
    expect(stringOpinions('class', 12)).toEqual(['12', true]);
    expect(stringOpinions('class', '  ')).toBeNull();
  });

  it('gives the declarations of a style string', () => {
    expect(stringOpinions('style', 'display: flex; gap: 4px !important')).toEqual(['display', 'flex', 'gap', '4px !important']);
    expect(stringOpinions('style', ';')).toBeNull();
  });

  it('has no opinion for null and undefined', () => {
    expect(stringOpinions('class', null)).toBeNull();
    expect(stringOpinions('style', undefined)).toBeNull();
  });
});

describe('keyOpinion', () => {
  it('makes a class present for a truthy value and absent for a falsy one', () => {
    expect(keyOpinion('class', 1, '')).toBe(true);
    expect(keyOpinion('class', 'yes', '')).toBe(true);
    expect([false, 0, '', NaN].map(value => keyOpinion('class', value, ''))).toEqual([false, false, false, false]);
  });

  it('gives a property its value followed by its unit, no opinion for an empty string', () => {
    expect(keyOpinion('style', 10, 'px')).toBe('10px');
    expect(keyOpinion('style', 'red', '')).toBe('red');
    expect(keyOpinion('style', 0, '')).toBe('0');
    expect(keyOpinion('style', '', 'px')).toBeUndefined();
  });

  it('has no opinion for null and undefined', () => {
    expect(keyOpinion('class', null, '')).toBeUndefined();
    expect(keyOpinion('style', undefined, 'px')).toBeUndefined();
  });
});

describe('toExactLength', () => {
  it('copies a list grown past two items, and keeps a shorter one', () => {
    const short = ['a', true];
    const long = ['a', true, 'b', true];
    expect(toExactLength(short)).toBe(short);
    expect(toExactLength(long)).not.toBe(long);
    expect(toExactLength(long)).toEqual(long);
  });
});
