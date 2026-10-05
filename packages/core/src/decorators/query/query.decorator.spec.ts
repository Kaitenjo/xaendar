// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import type { AccessorDecorator, Constructor } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { CustomElement } from '../../models/custom-element/custom-element';
import { effect } from '../../signals/effect/effect';
import type { QuerySignal } from '../../signals/types/query-signal.type';
import { _defineRender } from '../../utils/render-registry/render-registry.util';
import { WebComponent } from '../web-component/web-component.decorator';
import { Query, query, queryAll } from './query.decorator';

loadSignals();

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

let counter = 0;

/**
 * Creates an element, not connected to the document, whose Shadow DOM can be freely modified.
 */
function create(): CustomElement {
  const klass = class extends CustomElement { };
  _defineRender(klass, () => ({ clear: vi.fn() }) as never);
  const name = `x-query-decorator-${counter++}`;
  customElements.define(name, klass);
  return document.createElement(name) as CustomElement;
}

/**
 * Registers a web component through the `WebComponent` decorator, reproducing the class metadata
 * the runtime attaches to the decorated class.
 */
function defineComponent(base: Constructor<CustomElement> = CustomElement): { klass: Constructor<CustomElement>, selector: string } {
  const selector = `x-query-target-${counter++}`;
  const klass = class extends base { };
  const metadata = {};
  WebComponent({ selector, templateUrl: './x.html' })(klass, { metadata } as ClassDecoratorContext<Constructor<CustomElement>>);
  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: metadata });
  return { klass, selector };
}

function item(): HTMLElement {
  const element = document.createElement('div');
  element.setAttribute('item', '');
  return element;
}

/**
 * Applies the decorator the way the runtime does and returns the signal created by its initializer.
 */
function init<Value>(decorator: AccessorDecorator<CustomElement, QuerySignal<Value>>, element: CustomElement): QuerySignal<Value> {
  const decorated = decorator({} as never, {} as never);
  return decorated!.init!.call(element, undefined as never) as QuerySignal<Value>;
}

describe('query', () => {
  it('is null before any change of the Shadow DOM', () => {
    expect(query(create(), '[item]')()).toBeNull();
  });

  it('holds the first element having the attribute', async () => {
    const element = create();
    const signal = query(element, '[item]');
    const first = item();

    element.shadowRoot!.append(document.createElement('span'), first, item());
    await flush();

    expect(signal()).toBe(first);
  });

  it('goes back to null when the element is removed', async () => {
    const element = create();
    const signal = query(element, '[item]');
    const target = item();
    element.shadowRoot!.append(target);
    await flush();

    target.remove();
    await flush();

    expect(signal()).toBeNull();
  });

  it('does not notify when the element did not change', async () => {
    const element = create();
    const signal = query(element, '[item]');
    element.shadowRoot!.append(item());
    await flush();
    const spy = vi.fn();
    const dispose = effect(() => spy(signal()));
    spy.mockClear();

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(spy).not.toHaveBeenCalled();
    dispose();
  });

  it('holds the first element with the tag name when the target is a tag name', async () => {
    const element = create();
    const signal = query(element, 'section');
    const target = document.createElement('section');

    element.shadowRoot!.append(document.createElement('span'), target, document.createElement('section'));
    await flush();

    expect(signal()).toBe(target);
  });

  it('holds the first element matching a compound CSS selector', async () => {
    const element = create();
    const signal = query(element, 'ul > li.active');
    const list = document.createElement('ul');
    const inactive = document.createElement('li');
    const active = document.createElement('li');
    active.className = 'active';
    list.append(inactive, active);

    element.shadowRoot!.append(list);
    await flush();

    expect(signal()).toBe(active);
  });

  it('holds the first instance of the component when the target is a class', async () => {
    const element = create();
    const { klass, selector } = defineComponent();
    const signal = query(element, klass);
    const first = document.createElement(selector);

    element.shadowRoot!.append(document.createElement('span'), first, document.createElement(selector));
    await flush();

    expect(signal()).toBe(first);
    expect(first).toBeInstanceOf(klass);
  });

  it('ignores the elements of other components when the target is a class', async () => {
    const element = create();
    const { klass } = defineComponent();
    const other = defineComponent();
    const signal = query(element, klass);

    element.shadowRoot!.append(document.createElement(other.selector));
    await flush();

    expect(signal()).toBeNull();
  });

  it('throws when the class is not a registered web component', () => {
    class Plain extends CustomElement { }

    expect(() => query(create(), Plain)).toThrow('Plain does not seems to be decorated with @WebComponent');
  });
});

describe('queryAll', () => {
  it('is empty before any change of the Shadow DOM', () => {
    expect(queryAll(create(), '[item]')()).toEqual([]);
  });

  it('holds all the elements having the attribute, in document order', async () => {
    const element = create();
    const signal = queryAll(element, '[item]');
    const first = item();
    const second = item();
    const nested = item();
    const wrapper = document.createElement('section');
    wrapper.append(nested);

    element.shadowRoot!.append(first, document.createElement('span'), wrapper, second);
    await flush();

    expect(signal()).toEqual([first, nested, second]);
  });

  it('updates when an element is removed', async () => {
    const element = create();
    const signal = queryAll(element, '[item]');
    const first = item();
    const second = item();
    element.shadowRoot!.append(first, second);
    await flush();

    first.remove();
    await flush();

    expect(signal()).toEqual([second]);
  });

  it('notifies when the set of elements changes', async () => {
    const element = create();
    const signal = queryAll(element, '[item]');
    const spy = vi.fn();
    const dispose = effect(() => spy(signal()));
    spy.mockClear();

    element.shadowRoot!.append(item());
    await flush();

    expect(spy).toHaveBeenCalledOnce();
    dispose();
  });

  it('notifies when the elements change but their count does not', async () => {
    const element = create();
    const signal = queryAll(element, '[item]');
    const first = item();
    element.shadowRoot!.append(first);
    await flush();
    const spy = vi.fn();
    const dispose = effect(() => spy(signal()));
    spy.mockClear();

    first.remove();
    element.shadowRoot!.append(item());
    await flush();

    expect(spy).toHaveBeenCalledOnce();
    dispose();
  });

  it('does not notify when the elements did not change', async () => {
    const element = create();
    const signal = queryAll(element, '[item]');
    element.shadowRoot!.append(item());
    await flush();
    const spy = vi.fn();
    const dispose = effect(() => spy(signal()));
    spy.mockClear();

    element.shadowRoot!.append(document.createElement('span'));
    await flush();

    expect(spy).not.toHaveBeenCalled();
    dispose();
  });

  it('holds all the elements with the tag name or class when the target is a CSS selector', async () => {
    const element = create();
    const tags = queryAll(element, 'section');
    const classes = queryAll(element, '.card');
    const first = document.createElement('section');
    const second = document.createElement('div');
    second.className = 'card';

    element.shadowRoot!.append(first, second);
    await flush();

    expect(tags()).toEqual([first]);
    expect(classes()).toEqual([second]);
  });

  it('holds all the instances of the component when the target is a class', async () => {
    const element = create();
    const { klass, selector } = defineComponent();
    const other = defineComponent();
    const signal = queryAll(element, klass);
    const first = document.createElement(selector);
    const second = document.createElement(selector);

    element.shadowRoot!.append(first, document.createElement(other.selector), second);
    await flush();

    expect(signal()).toEqual([first, second]);
  });

  it('throws when the class is not a registered web component', () => {
    class Plain extends CustomElement { }

    expect(() => queryAll(create(), Plain)).toThrow('Plain does not seems to be decorated with @WebComponent');
  });
});

describe('Query decorator', () => {
  it('creates a signal holding the first element having the attribute', async () => {
    const element = create();
    const signal = init(Query('[item]'), element);
    expect(signal()).toBeNull();

    const target = item();
    element.shadowRoot!.append(target, item());
    await flush();

    expect(signal()).toBe(target);
  });

  it('creates a signal holding the first instance of the component', async () => {
    const element = create();
    const { klass, selector } = defineComponent();
    const signal = init(Query(klass), element);

    const target = document.createElement(selector);
    element.shadowRoot!.append(target);
    await flush();

    expect(signal()).toBe(target);
  });

  describe('all', () => {
    it('creates a signal holding all the elements having the attribute', async () => {
      const element = create();
      const signal = init(Query.all('[item]'), element);
      expect(signal()).toEqual([]);

      const first = item();
      const second = item();
      element.shadowRoot!.append(first, second);
      await flush();

      expect(signal()).toEqual([first, second]);
    });

    it('creates a signal holding all the instances of the component', async () => {
      const element = create();
      const { klass, selector } = defineComponent();
      const signal = init(Query.all(klass), element);

      const first = document.createElement(selector);
      const second = document.createElement(selector);
      element.shadowRoot!.append(first, second);
      await flush();

      expect(signal()).toEqual([first, second]);
    });
  });
});
