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

    expect(() => getSelector(Plain as unknown as Constructor<HTMLElement>)).toThrow('Plain does not seem to be decorated with @WebComponent');
  });

  it('throws when the metadata of the class do not hold a selector', () => {
    expect(() => getSelector(withMetadata({}))).toThrow('Decorated does not seem to be decorated with @WebComponent');
  });

  it('throws for a subclass without decorators of a component, which inherits the metadata of its parent', () => {
    const Parent = withMetadata({ [INTERNAL_SELECTOR]: 'x-parent' });
    const Child = class Child extends Parent { };

    expect(() => getSelector(Child)).toThrow('Child does not seem to be decorated with @WebComponent');
  });

  it('throws for a subclass with other decorators, whose metadata inherits the selector of its parent', () => {
    const parentMetadata = { [INTERNAL_SELECTOR]: 'x-parent' };
    const Parent = withMetadata(parentMetadata);
    const Child = class Child extends Parent { };
    Object.defineProperty(Child, Symbol.for('Symbol.metadata'), { value: Object.create(parentMetadata) });

    expect(() => getSelector(Child)).toThrow('Child does not seem to be decorated with @WebComponent');
  });

  it('returns the selector of a subclass decorated with @WebComponent, not the one of its parent', () => {
    const parentMetadata = { [INTERNAL_SELECTOR]: 'x-parent' };
    const Parent = withMetadata(parentMetadata);
    const Child = class Child extends Parent { };
    Object.defineProperty(Child, Symbol.for('Symbol.metadata'), { value: Object.assign(Object.create(parentMetadata), { [INTERNAL_SELECTOR]: 'x-child' }) });

    expect(getSelector(Child)).toBe('x-child');
  });
});
