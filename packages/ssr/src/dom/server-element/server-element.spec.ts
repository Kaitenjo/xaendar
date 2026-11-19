import { describe, expect, it } from 'vitest';
import { ServerElement } from './server-element';

describe('ServerElement', () => {
  it('reads its tag name from the local name assigned after constructing it, uppercase as the tag name of an element of the HTML namespace', () => {
    const element = new ServerElement();
    element.localName = 'my-card';

    expect(element.localName).toBe('my-card');
    expect(element.tagName).toBe('MY-CARD');
  });

  it('writes the attributes as strings, a new one after the others, an existing one in its place', () => {
    const element = new ServerElement();
    element.setAttribute('title', 'a');
    element.setAttribute('id', 1 as unknown as string);
    element.setAttribute('title', 'b');

    expect(element.getAttributeNames()).toEqual(['title', 'id']);
    expect(element.getAttribute('title')).toBe('b');
    expect(element.getAttribute('id')).toBe('1');
    expect(element.getAttribute('lang')).toBeNull();
  });

  it('removes an attribute', () => {
    const element = new ServerElement();
    element.setAttribute('title', 'a');

    element.removeAttribute('title');

    expect(element.hasAttribute('title')).toBe(false);
  });

  it('toggles an attribute as Element.toggleAttribute does', () => {
    const element = new ServerElement();

    expect(element.toggleAttribute('disabled', false)).toBe(false);
    expect(element.hasAttribute('disabled')).toBe(false);
    expect(element.toggleAttribute('disabled')).toBe(true);
    expect(element.getAttribute('disabled')).toBe('');
    expect(element.toggleAttribute('disabled', true)).toBe(true);
    expect(element.toggleAttribute('disabled')).toBe(false);
    expect(element.hasAttribute('disabled')).toBe(false);
  });

  it('listens to no event and dispatches none', () => {
    const element = new ServerElement();

    expect(element.addEventListener()).toBeUndefined();
    expect(element.removeEventListener()).toBeUndefined();
    expect(element.dispatchEvent()).toBe(true);
  });
});
