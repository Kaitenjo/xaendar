// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { restoreBindings, setStyle, toggleClass, untoggleClass, unsetStyle, updateAttribute } from './class-toggle.util';

const classesOf = (element: Element) => [...element.classList].sort().join(' ');

describe('class toggles', () => {
  it('toggles a class on and off', () => {
    const element = document.createElement('div');

    toggleClass(element, 'on', true);
    expect(classesOf(element)).toBe('on');

    toggleClass(element, 'on', false);
    expect(classesOf(element)).toBe('');
  });

  it('toggles the classes again after the class attribute is written, winning over the classes it lists', () => {
    const element = document.createElement('div');
    toggleClass(element, 'on', true);
    toggleClass(element, 'off', false);

    element.setAttribute('class', 'a off');
    restoreBindings(element, 'class');
    expect(classesOf(element)).toBe('a on');

    element.removeAttribute('class');
    restoreBindings(element, 'class');
    expect(classesOf(element)).toBe('on');
  });

  it('restores nothing after another attribute is written, or on an element without toggled classes', () => {
    const toggled = document.createElement('div');
    toggleClass(toggled, 'on', true);
    toggled.setAttribute('class', 'a');
    restoreBindings(toggled, 'title');
    expect(classesOf(toggled)).toBe('a');

    const plain = document.createElement('div');
    plain.setAttribute('class', 'a');
    restoreBindings(plain, 'class');
    expect(classesOf(plain)).toBe('a');
  });

  it('forgets a class it removes, which a write of the class attribute then keeps out', () => {
    const element = document.createElement('div');
    toggleClass(element, 'on', true);

    untoggleClass(element, 'on');
    expect(classesOf(element)).toBe('');

    element.setAttribute('class', 'a');
    restoreBindings(element, 'class');
    expect(classesOf(element)).toBe('a');
  });

  it('removes a class from an element without toggled classes', () => {
    const element = document.createElement('div');
    element.setAttribute('class', 'on');

    untoggleClass(element, 'on');
    expect(classesOf(element)).toBe('');
  });

  it('toggles a class only when the element does not have it as it should', () => {
    const element = document.createElement('div');
    element.setAttribute('class', 'on');
    const toggle = vi.spyOn(element.classList, 'toggle');

    toggleClass(element, 'on', true);
    toggleClass(element, 'off', false);

    expect(toggle).not.toHaveBeenCalled();
  });

  describe('updateAttribute()', () => {
    it('writes an attribute only when it differs, and removes it for null', () => {
      const element = document.createElement('div');
      const setAttribute = vi.spyOn(element, 'setAttribute');

      updateAttribute(element, 'title', 'a');
      updateAttribute(element, 'title', 'a');
      expect(setAttribute).toHaveBeenCalledOnce();

      updateAttribute(element, 'title', null);
      expect(element.hasAttribute('title')).toBe(false);
    });

    it('keeps the toggled classes when it writes class, which holds the value when it holds the same classes in any order', () => {
      const element = document.createElement('div');
      toggleClass(element, 'on', true);
      toggleClass(element, 'off', false);
      element.setAttribute('class', 'b a on');
      const setAttribute = vi.spyOn(element, 'setAttribute');

      updateAttribute(element, 'class', 'a b off');
      expect(setAttribute).not.toHaveBeenCalled();

      updateAttribute(element, 'class', 'a');
      expect(classesOf(element)).toBe('a on');

      updateAttribute(element, 'class', 'a c');
      expect(classesOf(element)).toBe('a c on');

      updateAttribute(element, 'class', null);
      expect(classesOf(element)).toBe('on');
    });
  });
});

describe('style properties', () => {
  it('sets a style property, writing it only when the element does not hold the value, and removes it for null', () => {
    const element = document.createElement('div');
    setStyle(element, 'width', '10px');
    expect(element.style.getPropertyValue('width')).toBe('10px');

    const setProperty = vi.spyOn(element.style, 'setProperty');
    setStyle(element, 'width', '10px');
    expect(setProperty).not.toHaveBeenCalled();

    setStyle(element, 'width', null);
    expect(element.style.getPropertyValue('width')).toBe('');
  });

  it('removes a style property set, and nothing on an element without it', () => {
    const element = document.createElement('div');
    const removeProperty = vi.spyOn(element.style, 'removeProperty');
    unsetStyle(element, 'color');
    expect(removeProperty).not.toHaveBeenCalled();

    setStyle(element, '--accent', 'red');
    unsetStyle(element, '--accent');
    expect(element.style.getPropertyValue('--accent')).toBe('');
  });

  it('sets the style properties again after the style attribute is written, winning over the ones it declares', () => {
    const element = document.createElement('div');
    setStyle(element, 'color', 'red');

    element.setAttribute('style', 'color: blue; width: 10px');
    restoreBindings(element, 'style');
    expect(element.style.getPropertyValue('color')).toBe('red');
    expect(element.style.getPropertyValue('width')).toBe('10px');

    restoreBindings(document.createElement('div'), 'style');
    restoreBindings(element, 'title');
  });

  it('writes the style attribute only when the element does not hold the properties it declares, bound ones included', () => {
    const element = document.createElement('div');
    setStyle(element, 'color', 'red');
    element.setAttribute('style', 'width: 10px; color: red;');
    const setAttribute = vi.spyOn(element, 'setAttribute');

    updateAttribute(element, 'style', 'width: 10px; color: blue');
    expect(setAttribute).not.toHaveBeenCalled();

    updateAttribute(element, 'style', 'width: 20px');
    expect(element.style.getPropertyValue('width')).toBe('20px');
    expect(element.style.getPropertyValue('color')).toBe('red');

    updateAttribute(element, 'style', 'width: 20px; height: 5px');
    expect(element.style.getPropertyValue('height')).toBe('5px');
  });

  it('compares the style attribute as a text on an element setting no style property', () => {
    const element = document.createElement('div');
    element.setAttribute('style', 'width: 10px;');
    const setAttribute = vi.spyOn(element, 'setAttribute');

    updateAttribute(element, 'style', 'width: 10px;');
    expect(setAttribute).not.toHaveBeenCalled();

    updateAttribute(element, 'style', 'width: 10px');
    expect(setAttribute).toHaveBeenCalledOnce();
  });
});
