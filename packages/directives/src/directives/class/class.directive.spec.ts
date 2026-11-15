// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

// The namespace keeps the type of the symbol, which destructuring widens
const core = await import('@xaendar/core');
const { _applyHostAttributes, _resolveDirective, _setInput, CustomDirective } = core;
const { ClassDirective } = await import('./class.directive');

/**
 * Applies the directive to an element with the class given, binding its value, and writes its classes as the server does.
 */
function apply(className: string, value: unknown): HTMLElement {
  const element = document.createElement('li');
  element.className = className;
  const directive = new ClassDirective();
  directive[core._SET_DIRECTIVE_ELEMENT] = element;
  _setInput(undefined as never, directive, { name: 'value', value } as never);
  _applyHostAttributes(directive, element);
  return element;
}

describe('ClassDirective', () => {
  it('is the custom directive of the selector class', () => {
    expect(_resolveDirective('class', CustomDirective)).toBe(ClassDirective);
  });

  it('gives the element the classes of its value, keeping the ones it has', () => {
    expect(apply('card', { active: true, done: false }).className).toBe('card active');
    expect(apply('', ['a', 'b']).className).toBe('a b');
    expect(apply('card', null).className).toBe('card');
  });
});
