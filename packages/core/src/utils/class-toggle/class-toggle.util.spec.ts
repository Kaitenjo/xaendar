// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { restoreToggledClasses, toggleClass, untoggleClass, updateAttribute } from './class-toggle.util';

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
    restoreToggledClasses(element, 'class');
    expect(classesOf(element)).toBe('a on');

    element.removeAttribute('class');
    restoreToggledClasses(element, 'class');
    expect(classesOf(element)).toBe('on');
  });

  it('restores nothing after another attribute is written, or on an element without toggled classes', () => {
    const toggled = document.createElement('div');
    toggleClass(toggled, 'on', true);
    toggled.setAttribute('class', 'a');
    restoreToggledClasses(toggled, 'title');
    expect(classesOf(toggled)).toBe('a');

    const plain = document.createElement('div');
    plain.setAttribute('class', 'a');
    restoreToggledClasses(plain, 'class');
    expect(classesOf(plain)).toBe('a');
  });

  it('forgets a class it removes, which a write of the class attribute then keeps out', () => {
    const element = document.createElement('div');
    toggleClass(element, 'on', true);

    untoggleClass(element, 'on');
    expect(classesOf(element)).toBe('');

    element.setAttribute('class', 'a');
    restoreToggledClasses(element, 'class');
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
