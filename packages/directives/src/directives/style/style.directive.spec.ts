// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

// The namespace keeps the type of the symbol, which destructuring widens
const core = await import('@xaendar/core');
const { _applyHostAttributes, _resolveDirective, _setInput, CustomDirective } = core;
const { StyleDirective } = await import('./style.directive');

/**
 * Applies the directive to an element with the style given, binding its value, and writes its properties as the server
 * does.
 */
function apply(style: string, value: unknown): HTMLElement {
  const element = document.createElement('div');
  element.setAttribute('style', style);
  const directive = new StyleDirective();
  directive[core._SET_DIRECTIVE_ELEMENT] = element;
  _setInput(undefined as never, directive, { name: 'value', value } as never);
  _applyHostAttributes(directive, element);
  return element;
}

describe('StyleDirective', () => {
  it('is the custom directive of the selector style', () => {
    expect(_resolveDirective('style', CustomDirective)).toBe(StyleDirective);
  });

  it('gives the element the properties of its value, keeping the ones it has', () => {
    const element = apply('display: flex', { 'width.px': 120, backgroundColor: 'red', '--accent': 'blue', color: null });

    expect(element.style.getPropertyValue('display')).toBe('flex');
    expect(element.style.getPropertyValue('width')).toBe('120px');
    expect(element.style.getPropertyValue('background-color')).toBe('red');
    expect(element.style.getPropertyValue('--accent')).toBe('blue');
    expect(element.style.getPropertyValue('color')).toBe('');
  });
});
