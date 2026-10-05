import type { Constructor } from '@xaendar/types';
import { describe, expect, it } from 'vitest';
import { INTERNAL_SELECTOR } from '../../costants';
import { getSelector } from './get-selector.util';

function withMetadata(metadata: unknown): Constructor<HTMLElement> {
  const klass = class Decorated { } as unknown as Constructor<HTMLElement>;
  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: metadata });
  return klass;
}

describe('getSelector', () => {
  it('returns the selector stored in the metadata of the class', () => {
    expect(getSelector(withMetadata({ [INTERNAL_SELECTOR]: 'x-button' }))).toBe('x-button');
  });

  it('throws when the class has no metadata', () => {
    class Plain { }

    expect(() => getSelector(Plain as unknown as Constructor<HTMLElement>)).toThrow('Plain does not seems to be decorated with @WebComponent');
  });

  it('throws when the metadata of the class do not hold a selector', () => {
    expect(() => getSelector(withMetadata({}))).toThrow('Decorated does not seems to be decorated with @WebComponent');
  });
});
