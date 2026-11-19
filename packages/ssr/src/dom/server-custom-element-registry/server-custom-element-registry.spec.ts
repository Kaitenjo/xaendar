import { describe, expect, it } from 'vitest';
import { ServerCustomElementRegistry } from './server-custom-element-registry';

/**
 * Creates a class named as given, as a module evaluated again creates the same class.
 */
const createClass = (name: string) => ({ [name]: class { } })[name] as unknown as CustomElementConstructor;

describe('ServerCustomElementRegistry', () => {
  it('defines a class with a tag name, returning one from the other', () => {
    const registry = new ServerCustomElementRegistry();
    const Card = createClass('Card');

    registry.define('my-card', Card);

    expect(registry.get('my-card')).toBe(Card);
    expect(registry.getName(Card)).toBe('my-card');
    expect(registry.get('my-other')).toBeUndefined();
    expect(registry.getName(createClass('Other'))).toBeNull();
  });

  it('throws for an invalid custom element name', () => {
    expect(() => new ServerCustomElementRegistry().define('card', createClass('Card'))).toThrow(expect.objectContaining({ name: 'SyntaxError' }));
  });

  it('replaces the class defined with a tag name by a class named like it, as a module evaluated again defines it', () => {
    const registry = new ServerCustomElementRegistry();
    const first = createClass('Card');
    const second = createClass('Card');
    registry.define('my-card', first);

    registry.define('my-card', second);

    expect(registry.get('my-card')).toBe(second);
    expect(registry.getName(first)).toBeNull();
  });

  it('throws when the tag name is defined with a class named otherwise, or the class with another tag name', () => {
    const registry = new ServerCustomElementRegistry();
    const Card = createClass('Card');
    registry.define('my-card', Card);

    expect(() => registry.define('my-card', createClass('Other'))).toThrow(expect.objectContaining({ name: 'NotSupportedError' }));
    expect(() => registry.define('my-other', Card)).toThrow(expect.objectContaining({ name: 'NotSupportedError' }));
  });

  it('resolves whenDefined once the tag name is defined, at once when it already is', async () => {
    const registry = new ServerCustomElementRegistry();
    const Card = createClass('Card');
    const waiting = registry.whenDefined('my-card');

    expect(registry.whenDefined('my-card')).toBe(waiting);
    registry.define('my-card', Card);

    await expect(waiting).resolves.toBe(Card);
    await expect(registry.whenDefined('my-card')).resolves.toBe(Card);
  });
});
