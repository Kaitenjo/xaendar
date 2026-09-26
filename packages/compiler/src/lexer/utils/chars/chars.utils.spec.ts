import { describe, expect, it } from 'vitest';
import { isNotBlank } from './chars.utils';

describe('isNotBlank', () => {
  it('returns true for a string containing non-whitespace characters', () => {
    expect(isNotBlank('hello')).toBe(true);
  });

  it('returns true when whitespace surrounds non-whitespace characters', () => {
    expect(isNotBlank('  hello  ')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isNotBlank('')).toBe(false);
  });

  it('returns false for a string made only of spaces', () => {
    expect(isNotBlank('   ')).toBe(false);
  });

  it('returns false for a string made of mixed whitespace characters', () => {
    expect(isNotBlank('\n\r\t\f\v')).toBe(false);
  });
});
