import { describe, expect, it } from 'vitest';
import { slice } from './string.utils';

describe('slice()', () => {

  it('returns the whole string when no bounds are given', () => {
    expect(slice('Hello world')).toEqual('Hello world');
  });

  it('extracts a substring between start and end', () => {
    expect(slice('Hello world', 0, 5)).toEqual('Hello');
  });

  it('extracts a substring from start to the end of the string', () => {
    expect(slice('Hello world', 6)).toEqual('world');
  });

  it('supports a negative start index', () => {
    expect(slice('Hello world', -5)).toEqual('world');
  });

  it('supports a negative end index', () => {
    expect(slice('Hello world', 0, -6)).toEqual('Hello');
  });

  it('returns a plain string value equal to the native slice result', () => {
    const source = 'Hello world';
    expect(slice(source, 0, 5)).toEqual(source.slice(0, 5));
  });
});
