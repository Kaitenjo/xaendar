// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { restoreToggledClasses, toggleClass, untoggleClass } from './class-toggle.util';

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
});
