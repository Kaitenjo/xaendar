// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _scope, EMPTY_LAYOUT } = await import('../context/context.util');
const { signal } = await import('../../signals');
const { _removeStyle, _setExpressionStyle, _setReactiveStyle } = await import('./style-binding.util');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));
const createContext = () => _scope(null, EMPTY_LAYOUT);

/**
 * Describes a style binding the way the module of a template does.
 */
const styleBinding = (name: string, value: RenderElementAttribute['value'], unit?: string): RenderElementAttribute => ({ name, unit, value, setter: _setReactiveStyle, unbind: _removeStyle });

describe('style bindings', () => {
  it('_setExpressionStyle sets the property once, followed by the unit of the binding', () => {
    const element = document.createElement('div');

    _setExpressionStyle(createContext(), element, styleBinding('width', () => 120, 'px'));
    _setExpressionStyle(createContext(), element, styleBinding('color', () => 'red'));
    _setExpressionStyle(createContext(), element, styleBinding('--accent', () => 'blue'));

    expect(element.style.getPropertyValue('width')).toBe('120px');
    expect(element.style.getPropertyValue('color')).toBe('red');
    expect(element.style.getPropertyValue('--accent')).toBe('blue');
  });

  it.each([null, undefined, false])('_setExpressionStyle removes the property for %s', value => {
    const element = document.createElement('div');
    element.style.setProperty('width', '5px');

    _setExpressionStyle(createContext(), element, styleBinding('width', () => value, 'px'));

    expect(element.style.getPropertyValue('width')).toBe('');
  });

  it('_setReactiveStyle sets the property again when a signal it reads changes, and _removeStyle removes it', async () => {
    const element = document.createElement('div');
    const width = signal(10);
    const binding = Object.assign(styleBinding('width', () => width(), '%'), { effect: 0 });
    const context = _scope(null, { size: 6, nodes: 6, bindings: 5 });

    _setReactiveStyle(context, element, binding);
    expect(element.style.getPropertyValue('width')).toBe('10%');

    width.set(50);
    await flush();
    expect(element.style.getPropertyValue('width')).toBe('50%');

    _removeStyle(context, element, binding);
    expect(element.style.getPropertyValue('width')).toBe('');
  });
});
