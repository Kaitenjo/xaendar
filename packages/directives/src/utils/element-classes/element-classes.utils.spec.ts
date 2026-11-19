import { describe, expect, it } from 'vitest';
import { toClassString } from './element-classes.utils';

describe('toClassString', () => {
  it('keeps a string as it is', () => {
    expect(toClassString('card  wide')).toBe('card  wide');
    expect(toClassString('')).toBe('');
  });

  it('joins the classes of a list or of a set', () => {
    expect(toClassString(['card', 'wide'])).toBe('card wide');
    expect(toClassString(new Set(['card', 'wide']))).toBe('card wide');
    expect(toClassString([])).toBe('');
  });

  it('gives the keys of an object whose value is truthy', () => {
    expect(toClassString({ active: true, done: 0, 'big bold': 'yes', hidden: null })).toBe('active big bold');
    expect(toClassString({ off: false })).toBe('');
  });

  it('gives no class for null and undefined', () => {
    expect(toClassString(null)).toBeUndefined();
    expect(toClassString(undefined)).toBeUndefined();
  });
});
