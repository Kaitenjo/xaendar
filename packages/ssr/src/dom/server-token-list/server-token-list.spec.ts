import { describe, expect, it } from 'vitest';
import { ServerElement } from '../server-element/server-element';

describe('ServerTokenList', () => {
  it('reads the distinct tokens of the attribute, separated by any ASCII whitespace', () => {
    const element = new ServerElement();
    element.setAttribute('class', ' a\tb\na  c ');

    expect(element.classList.length).toBe(3);
    expect(element.classList.contains('c')).toBe(true);
    expect(element.classList.contains('d')).toBe(false);
    expect(element.classList.value).toBe(' a\tb\na  c ');
    expect(element.classList.toString()).toBe(' a\tb\na  c ');
  });

  it('reads no token, and an empty value, when the element does not have the attribute', () => {
    const element = new ServerElement();

    expect(element.classList.length).toBe(0);
    expect(element.classList.value).toBe('');
  });

  it('adds the tokens it does not hold at the end, writing the attribute as an ordered set', () => {
    const element = new ServerElement();
    element.setAttribute('class', 'a  b a');

    element.classList.add('c', 'a', 'd');

    expect(element.getAttribute('class')).toBe('a b c d');
  });

  it('removes tokens, writing the attribute even when nothing changes, unless the element does not have it', () => {
    const element = new ServerElement();
    element.classList.remove('a');
    expect(element.hasAttribute('class')).toBe(false);

    element.setAttribute('class', 'a  b');
    element.classList.remove('c');
    expect(element.getAttribute('class')).toBe('a b');

    element.classList.remove('a', 'b');
    expect(element.getAttribute('class')).toBe('');
  });

  it('toggles a token, force only adding or only removing it, without writing the attribute when nothing changes', () => {
    const element = new ServerElement();

    expect(element.classList.toggle('a', false)).toBe(false);
    expect(element.hasAttribute('class')).toBe(false);
    expect(element.classList.toggle('a')).toBe(true);
    expect(element.classList.toggle('b', true)).toBe(true);
    expect(element.getAttribute('class')).toBe('a b');
    expect(element.classList.toggle('a', true)).toBe(true);
    expect(element.classList.toggle('a')).toBe(false);
    expect(element.getAttribute('class')).toBe('b');
  });

  it('throws for an empty token or one holding whitespace, as DOMTokenList does', () => {
    const element = new ServerElement();

    expect(() => element.classList.add('')).toThrow(expect.objectContaining({ name: 'SyntaxError' }));
    expect(() => element.classList.toggle('a b')).toThrow(expect.objectContaining({ name: 'InvalidCharacterError' }));
  });
});
