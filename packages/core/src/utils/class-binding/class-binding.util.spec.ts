// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { _Context } = await import('../context/context.util');
const { _createElement } = await import('../render-element/render-element.util');
const { signal } = await import('../../signals');
const { _removeClass, _setExpressionClass, _setReactiveClass } = await import('./class-binding.util');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));
const createContext = () => new _Context({ createElement: _createElement } as never);

describe('class bindings', () => {
  it('_setExpressionClass toggles the class once, by whether the value is truthy', () => {
    const element = document.createElement('div');

    _setExpressionClass(createContext(), element, 'on', () => 'yes');
    _setExpressionClass(createContext(), element, 'off', () => 0);

    expect(element.className).toBe('on');
  });

  it('_setReactiveClass toggles the class again whenever the value changes, until its context is destroyed', async () => {
    const element = document.createElement('div');
    const active = signal(1);
    const context = createContext();

    _setReactiveClass(context, element, 'on', () => active());
    await flush();
    expect(element.className).toBe('on');

    active.set(0);
    await flush();
    expect(element.className).toBe('');

    context.clear();
    active.set(1);
    await flush();
    expect(element.className).toBe('');
  });

  it('_removeClass removes the class', () => {
    const element = document.createElement('div');
    _setExpressionClass(createContext(), element, 'on', () => true);

    _removeClass(createContext(), element, 'on');

    expect(element.className).toBe('');
  });
});
