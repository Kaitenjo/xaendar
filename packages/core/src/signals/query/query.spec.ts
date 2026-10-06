// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import type { Constructor } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_SELECTOR } from '../../costants';
import { CustomElement } from '../../models/custom-element/custom-element';
import { _defineRender } from '../../utils/render-registry/render-registry.util';
import { effect } from '../effect/effect';
import { createQuerySignal, toSelector } from './query';

loadSignals();

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

let counter = 0;
function create(render: (element: CustomElement) => void = () => undefined): CustomElement {
  const klass = class extends CustomElement { };
  _defineRender(klass, function (this: CustomElement) {
    render(this);
    return { clear: vi.fn() } as never;
  });
  const name = `x-query-signal-${counter++}`;
  customElements.define(name, klass);
  return document.createElement(name) as CustomElement;
}

/**
 * Creates a query signal on a new element, then connects the element to the document.
 */
function connected<Value>(read: (shadowRoot: ShadowRoot) => Value, initialValue: Value, equals?: (a: Value, b: Value) => boolean) {
  const element = create();
  const signal = createQuerySignal(element, read, initialValue, equals);
  document.body.appendChild(element);
  return { element, signal };
}

function withMetadata(metadata: unknown): Constructor<HTMLElement> {
  const klass = class Decorated extends CustomElement { };
  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: metadata });
  return klass;
}

describe('toSelector', () => {
  it.each(['x-button', 'div', '.card', '#main', '[item]', 'ul > li.active'])('is the string itself when the target is the CSS selector "%s"', selector => {
    expect(toSelector(selector)).toBe(selector);
  });

  it('is the selector the class is registered with when the target is a class', () => {
    expect(toSelector(withMetadata({ [INTERNAL_SELECTOR]: 'x-button' }))).toBe('x-button');
  });

  it('throws when the target is a class not decorated with @WebComponent', () => {
    class Plain extends CustomElement { }

    expect(() => toSelector(Plain)).toThrow('Plain does not seems to be decorated with @WebComponent');
  });
});

describe('createQuerySignal', () => {
  const read = (shadowRoot: ShadowRoot) => shadowRoot.childElementCount;

  it('holds the initial value until the element is connected', () => {
    expect(createQuerySignal(create(), read, -1)()).toBe(-1);
  });

  it('does not observe the Shadow DOM until the element is connected', async () => {
    const element = create();
    const signal = createQuerySignal(element, read, -1);

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(signal()).toBe(-1);
  });

  it('reads the value on connection, right after the render', () => {
    const element = create(element => element.shadowRoot!.append(document.createElement('span')));
    const signal = createQuerySignal(element, read, -1);

    document.body.appendChild(element);

    expect(signal()).toBe(1);
    element.remove();
  });

  it('is recomputed each time the Shadow DOM changes', async () => {
    const { element, signal } = connected(read, 0);

    element.shadowRoot!.append(document.createElement('span'), document.createElement('span'));
    await flush();

    expect(signal()).toBe(2);
    expect(signal.get()).toBe(2);
    element.remove();
  });

  it('observes also the nested nodes', async () => {
    const { element, signal } = connected(shadowRoot => shadowRoot.querySelectorAll('i').length, 0);
    const wrapper = document.createElement('section');
    element.shadowRoot!.append(wrapper);
    await flush();

    wrapper.append(document.createElement('i'));
    await flush();

    expect(signal()).toBe(1);
    element.remove();
  });

  it('uses the given equality function to decide whether to notify', async () => {
    const { element, signal } = connected(read, 0, () => true);
    const spy = vi.fn();
    const dispose = effect(() => spy(signal()));
    spy.mockClear();

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(spy).not.toHaveBeenCalled();
    dispose();
    element.remove();
  });

  it('notifies when the value changes', async () => {
    const { element, signal } = connected(read, 0);
    const spy = vi.fn();
    const dispose = effect(() => spy(signal()));
    spy.mockClear();

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(spy).toHaveBeenCalledExactlyOnceWith(1);
    dispose();
    element.remove();
  });

  it('stops observing the Shadow DOM when the element is disconnected', async () => {
    const { element, signal } = connected(read, 0);
    element.remove();

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(signal()).toBe(0);
  });

  it('reads the value again and keeps updating when the element is inserted again', async () => {
    const { element, signal } = connected(read, 0);
    element.remove();
    element.shadowRoot!.append(document.createElement('span'));

    document.body.appendChild(element);
    expect(signal()).toBe(1);

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(signal()).toBe(2);
    element.remove();
  });
});
