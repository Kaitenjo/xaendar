import { describe, expect, it } from 'vitest';
import { getWebComponentMetadata } from './get-metadata.util';

describe('getWebComponentMetadata', () => {
  it('reads the metadata the decorators stored in the class', () => {
    const metadata = { selector: 'x-card' };
    const klass = class { };
    Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: metadata });

    expect(getWebComponentMetadata(klass)).toBe(metadata);
  });

  it('returns undefined for a class none of whose decorators stored any', () => {
    expect(getWebComponentMetadata(class { })).toBeUndefined();
  });
});
