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
function create(): CustomElement {
  const klass = class extends CustomElement { };
  _defineRender(klass, () => ({ clear: vi.fn() }) as never);
  const name = `x-query-signal-${counter++}`;
  customElements.define(name, klass);
  return document.createElement(name) as CustomElement;
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

  it('holds the initial value before any change of the Shadow DOM', () => {
    expect(createQuerySignal(create(), read, -1)()).toBe(-1);
  });

  it('is recomputed each time the Shadow DOM changes', async () => {
    const element = create();
    const signal = createQuerySignal(element, read, 0);

    element.shadowRoot!.append(document.createElement('span'), document.createElement('span'));
    await flush();

    expect(signal()).toBe(2);
    expect(signal.get()).toBe(2);
  });

  it('observes also the nested nodes', async () => {
    const element = create();
    const signal = createQuerySignal(element, shadowRoot => shadowRoot.querySelectorAll('i').length, 0);
    const wrapper = document.createElement('section');
    element.shadowRoot!.append(wrapper);
    await flush();

    wrapper.append(document.createElement('i'));
    await flush();

    expect(signal()).toBe(1);
  });

  it('uses the given equality function to decide whether to notify', async () => {
    const element = create();
    const signal = createQuerySignal(element, read, 0, () => true);
    const spy = vi.fn();
    const dispose = effect(() => spy(signal()));
    spy.mockClear();

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(spy).not.toHaveBeenCalled();
    dispose();
  });

  it('notifies when the value changes', async () => {
    const element = create();
    const signal = createQuerySignal(element, read, 0);
    const spy = vi.fn();
    const dispose = effect(() => spy(signal()));
    spy.mockClear();

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(spy).toHaveBeenCalledExactlyOnceWith(1);
    dispose();
  });

  it('stops observing the Shadow DOM when the element is disconnected', async () => {
    const element = create();
    const signal = createQuerySignal(element, read, 0);
    document.body.appendChild(element);
    element.remove();

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(signal()).toBe(0);
  });
});
