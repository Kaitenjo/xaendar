import { describe, expect, it } from 'vitest';
import { _encodeTrackKey } from './track-key.util';

describe('_encodeTrackKey()', () => {
  it('encodes a number and a string as distinct keys', () => {
    expect(_encodeTrackKey(1)).toBe('n1');
    expect(_encodeTrackKey('1')).toBe('s1');
  });

  it('encodes a string as a URI component, which never ends a comment', () => {
    expect(_encodeTrackKey('a b-->c')).toBe('sa%20b--%3Ec');
  });
});
