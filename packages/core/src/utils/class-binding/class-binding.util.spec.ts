// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';

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

/**
 * Describes a class binding the way the module of a template does.
 */
const classBinding = (name: string, value: RenderElementAttribute['value'], reads?: readonly string[]): RenderElementAttribute => ({ name, value, setter: _setReactiveClass, unbind: _removeClass, reads });

describe('class bindings', () => {
  it('_setExpressionClass toggles the class once, by whether the value is truthy', () => {
    const element = document.createElement('div');

    _setExpressionClass(createContext(), element, classBinding('on', () => 'yes'));
    _setExpressionClass(createContext(), element, classBinding('off', () => 0));

    expect(element.className).toBe('on');
  });

  it('_setExpressionClass calls the expression with the component of the context as this and the context', () => {
    const element = document.createElement('div');
    const component = { active: true };
    const context = new _Context(createContext(), undefined, 0, component);
    const expression = vi.fn(function (this: typeof component, _context: InstanceType<typeof _Context>) {
      return this.active;
    });

    _setExpressionClass(context, element, classBinding('on', expression));

    expect(expression).toHaveBeenCalledExactlyOnceWith(context);
    expect(expression.mock.contexts).toEqual([component]);
    expect(element.className).toBe('on');
  });

  it('_setReactiveClass toggles the class again whenever the value changes, until its context is destroyed', async () => {
    const element = document.createElement('div');
    const active = signal(1);
    const context = createContext();

    _setReactiveClass(context, element, classBinding('on', () => active()));
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

  it('_setReactiveClass toggles the class again when a variable of the template it reads changes', () => {
    const element = document.createElement('div');
    const context = createContext();
    context.addIdentifier('active', false);

    _setReactiveClass(context, element, classBinding('on', scope => scope.get('active'), ['active']));
    expect(element.className).toBe('');

    context.update('active', true);
    context.refresh(['active']);

    expect(element.className).toBe('on');
  });

  it('_removeClass removes the class', () => {
    const element = document.createElement('div');
    _setExpressionClass(createContext(), element, classBinding('on', () => true));

    _removeClass(createContext(), element, classBinding('on', () => true));

    expect(element.className).toBe('');
  });
});
