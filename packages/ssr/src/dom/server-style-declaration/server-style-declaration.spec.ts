import { describe, expect, it } from 'vitest';
import type { AttributeOwner } from '../types/attribute-owner.type';
import { ServerStyleDeclaration } from './server-style-declaration';

/**
 * An element holding its attributes in a map.
 */
function ownerWith(style?: string): AttributeOwner & { attributes: Map<string, string> } {
  const attributes = new Map<string, string>();
  if (style !== undefined) {
    attributes.set('style', style);
  }

  return {
    attributes,
    getAttribute: name => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, value)
  };
}

describe('ServerStyleDeclaration', () => {
  it('reads the declarations of the style attribute', () => {
    const style = new ServerStyleDeclaration(ownerWith('color: red;width:10px; ;--x: a:b'));

    expect(style.length).toBe(3);
    expect(style.getPropertyValue('color')).toBe('red');
    expect(style.getPropertyValue('width')).toBe('10px');
    expect(style.getPropertyValue('--x')).toBe('a:b');
    expect(style.getPropertyValue('height')).toBe('');
  });

  it('declares a property in its place, or at the end, writing the attribute as a browser serializes it', () => {
    const owner = ownerWith('color: red; width: 10px;');
    const style = new ServerStyleDeclaration(owner);

    style.setProperty('color', 'blue');
    style.setProperty('--accent', '#fff');

    expect(owner.attributes.get('style')).toBe('color: blue; width: 10px; --accent: #fff;');
  });

  it('writes the attribute of an element without one', () => {
    const owner = ownerWith();
    new ServerStyleDeclaration(owner).setProperty('width', '50%');
    expect(owner.attributes.get('style')).toBe('width: 50%;');
  });

  it('removes a property, returning its value, and removes the one an empty value sets', () => {
    const owner = ownerWith('color: red; width: 10px;');
    const style = new ServerStyleDeclaration(owner);

    expect(style.removeProperty('color')).toBe('red');
    expect(style.removeProperty('height')).toBe('');
    style.setProperty('width', '');

    expect(owner.attributes.get('style')).toBe('');
    expect(style.length).toBe(0);
  });
});
