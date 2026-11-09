// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import type { Constructor } from '@xaendar/types';
import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_SELECTOR } from '../../costants';
import { CustomElement } from '../../models/custom-element/custom-element';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { _addAppliedDirective } from '../../utils/applied-directives/applied-directives.util';
import { _Context } from '../../utils/context/context.util';
import { _setElementRef } from '../../utils/element-refs/element-refs.util';
import { _defineRender } from '../../utils/render-registry/render-registry.util';
import { effect } from '../effect/effect';
import { createContentQuerySignal, createQuerySignal, toMatcher, toRefMatcher } from './query';

loadSignals();

const flush = () => new Promise<void>(resolve => setTimeout(resolve));

let counter = 0;
function create(render: (element: CustomElement) => void = () => undefined): CustomElement {
  const klass = class extends CustomElement { };
  _defineRender(klass, function (this: CustomElement) {
    render(this);
    return new _Context({} as never);
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

/**
 * Creates an element whose render adds to its Shadow DOM a slot for each of the given names,
 * the empty string standing for the default slot.
 */
function withSlots(...names: string[]): CustomElement {
  return create(element => element.shadowRoot!.append(...names.map(name => {
    const slot = document.createElement('slot');
    if (name) {
      slot.name = name;
    }
    return slot;
  })));
}

/**
 * Creates an element having the `item` attribute, and the `slot` attribute when a slot is given.
 */
function item(slot?: string): HTMLElement {
  const element = document.createElement('div');
  element.setAttribute('item', '');
  if (slot) {
    element.slot = slot;
  }
  return element;
}

function withMetadata(metadata: unknown): Constructor<HTMLElement> {
  const klass = class Decorated extends CustomElement { };
  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: metadata });
  return klass;
}

describe('toMatcher', () => {
  it.each(['x-button', 'div', '.card', '#main', '[item]', 'ul > li.active'])('matches the elements themselves with the CSS selector "%s"', selector => {
    expect(toMatcher(selector)).toEqual({ selector, description: selector });
  });

  it('matches the elements with the selector the class is registered with when the target is a component', () => {
    expect(toMatcher(withMetadata({ [INTERNAL_SELECTOR]: 'x-button' }))).toEqual({ selector: 'x-button', description: 'x-button' });
  });

  it('throws when the target is a class not decorated with @WebComponent', () => {
    class Plain extends CustomElement { }

    expect(() => toMatcher(Plain)).toThrow('Plain does not seem to be decorated with @WebComponent');
  });

  it('picks the instances of a directive, and of its subclasses, applied to any element, in the order of the elements', () => {
    class Tooltip extends CustomDirective { }
    class RichTooltip extends Tooltip { }
    class Other extends CustomDirective { }
    const [first, second, bare] = [document.createElement('p'), document.createElement('p'), document.createElement('p')];
    const [tooltip, rich, other] = [new Tooltip(), new RichTooltip(), new Other()];
    _addAppliedDirective(first, other);
    _addAppliedDirective(first, rich);
    _addAppliedDirective(second, tooltip);

    const matcher = toMatcher(Tooltip);
    expect(matcher).toMatchObject({ selector: '*', description: 'Tooltip' });
    expect(matcher.pick!([first, bare, second])).toEqual([rich, tooltip]);
  });
});

describe('toMatcher with read', () => {
  class Tooltip extends CustomDirective { }
  class Mark extends CustomDirective { }

  /**
   * Creates an element with the given attribute, the given directives applied to it.
   */
  function withDirectives(attribute: string, ...directives: CustomDirective[]): HTMLElement {
    const element = document.createElement('p');
    element.setAttribute(attribute, '');
    for (let i = 0; i < directives.length; i++) {
      _addAppliedDirective(element, directives[i]);
    }
    return element;
  }

  it('reads the instances of a directive applied to the elements a selector finds, skipping the elements without it', () => {
    const [mark, other] = [new Mark(), new Mark()];
    const elements = [withDirectives('item'), withDirectives('item', new Tooltip(), mark), withDirectives('item', other)];

    const matcher = toMatcher('[item]', Mark);
    expect(matcher).toMatchObject({ selector: '[item]', description: '[item], read: Mark' });
    expect(matcher.pick!(elements)).toEqual([mark, other]);
  });

  it('reads the elements a directive is applied to', () => {
    const elements = [withDirectives('a'), withDirectives('b', new Tooltip()), withDirectives('c', new Tooltip(), new Tooltip())];

    const matcher = toMatcher(Tooltip, 'element');
    expect(matcher).toMatchObject({ selector: '*', description: 'Tooltip, read: element' });
    expect(matcher.pick!(elements)).toEqual([elements[1], elements[2]]);
  });

  it('reads another directive applied to the elements a directive is applied to', () => {
    const mark = new Mark();
    const elements = [withDirectives('a', new Mark()), withDirectives('b', new Tooltip(), mark), withDirectives('c', new Tooltip())];

    expect(toMatcher(Tooltip, Mark).pick!(elements)).toEqual([mark]);
  });

  it('keeps the elements themselves when reading the element of a selector or of a component', () => {
    expect(toMatcher('[item]', 'element')).toEqual({ selector: '[item]', description: '[item], read: element' });
    expect(toMatcher(withMetadata({ [INTERNAL_SELECTOR]: 'x-button' }), 'element')).toEqual({ selector: 'x-button', description: 'x-button, read: element' });
  });

  it('reads the instances of a directive applied to the elements a ref names', () => {
    const mark = new Mark();
    const [named, other] = [withDirectives('a', mark), withDirectives('b', new Mark())];
    _setElementRef(named, 'row');

    const matcher = toRefMatcher('row', Mark);
    expect(matcher.description).toBe('#row, read: Mark');
    expect(matcher.pick!([named, other])).toEqual([mark]);
    expect(toRefMatcher('row', 'element').pick!([named, other])).toEqual([named]);
  });
});

describe('toRefMatcher', () => {
  it('picks the elements named by the ref, in order', () => {
    const [first, other, bare, second] = [document.createElement('input'), document.createElement('input'), document.createElement('input'), document.createElement('input')];
    _setElementRef(first, 'note');
    _setElementRef(other, 'title');
    _setElementRef(second, 'note');

    const matcher = toRefMatcher('note');
    expect(matcher).toMatchObject({ selector: '*', description: '#note' });
    expect(matcher.pick!([first, other, bare, second])).toEqual([first, second]);
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
});

describe('createContentQuerySignal', () => {
  const all = (elements: Element[]) => elements;

  /**
   * Creates a content query signal looking for `[item]` on the given element, then connects the element to the document.
   */
  function connectedContent(element: CustomElement, descendants = true, map: (elements: Element[]) => Element[] = all) {
    const signal = createContentQuerySignal(element, toMatcher('[item]'), descendants, map, []);
    document.body.appendChild(element);
    return signal;
  }

  it('holds the initial value until the element is connected', () => {
    const element = withSlots('');
    element.append(item());

    expect(createContentQuerySignal(element, toMatcher('[item]'), true, all, [])()).toEqual([]);
  });

  it('holds the matching elements of the light DOM and their descendants in document order, whether a slot renders them or not', () => {
    const element = withSlots('a');
    const [unassigned, inA, nested, inMissing] = [item(), item('a'), item(), item('missing')];
    const wrapper = document.createElement('section');
    wrapper.append(nested);
    element.append(unassigned, wrapper, inA, inMissing);

    expect(connectedContent(element)()).toEqual([unassigned, nested, inA, inMissing]);
    element.remove();
  });

  it('holds the content also when the Shadow DOM has no slot', () => {
    const element = withSlots();
    const [inDefault, inA] = [item(), item('a')];
    element.append(inDefault, inA);

    expect(connectedContent(element)()).toEqual([inDefault, inA]);
    element.remove();
  });

  it('matches the slot attribute as any other attribute', () => {
    const element = withSlots('a');
    const [inB, inA] = [item('b'), item('a')];
    element.append(inB, inA);
    const signal = createContentQuerySignal(element, toMatcher('[slot="a"]'), true, all, []);
    document.body.appendChild(element);

    expect(signal()).toEqual([inA]);
    element.remove();
  });

  it('holds only the matching children of the element without descendants', () => {
    const element = withSlots('');
    const [child, nested] = [item(), item()];
    const wrapper = document.createElement('section');
    wrapper.append(nested);
    element.append(wrapper, child);

    expect(connectedContent(element, false)()).toEqual([child]);
    element.remove();
  });

  it('ignores the Shadow DOM and the fallback content of its slots', () => {
    const element = create(host => {
      const slot = document.createElement('slot');
      slot.append(item());
      host.shadowRoot!.append(slot, item());
    });

    expect(connectedContent(element)()).toEqual([]);
    element.remove();
  });

  it('holds a slot forwarded by an ancestor as an element, not the content it carries', () => {
    const outer = document.createElement('div');
    const forwarded = document.createElement('slot');
    const element = withSlots('');
    element.append(forwarded);
    outer.attachShadow({ mode: 'open' }).append(element);
    outer.append(item());
    const items = createContentQuerySignal(element, toMatcher('[item]'), true, all, []);
    const slots = createContentQuerySignal(element, toMatcher('slot'), true, all, []);

    document.body.appendChild(outer);

    expect(items()).toEqual([]);
    expect(slots()).toEqual([forwarded]);
    outer.remove();
  });

  it('is recomputed each time the light DOM changes, at any depth', async () => {
    const element = withSlots();
    const wrapper = document.createElement('section');
    element.append(wrapper);
    const signal = connectedContent(element);
    const target = item();

    wrapper.append(target);
    await flush();

    expect(signal()).toEqual([target]);
    element.remove();
  });

  it('is recomputed only when the children of the element change, without descendants', async () => {
    const element = withSlots();
    const wrapper = document.createElement('section');
    element.append(wrapper);
    const reads = vi.fn(all);
    const signal = connectedContent(element, false, reads);
    reads.mockClear();

    wrapper.append(item());
    await flush();

    expect(reads).not.toHaveBeenCalled();

    const target = item();
    element.append(target);
    await flush();

    expect(signal()).toEqual([target]);
    element.remove();
  });

  it('is not recomputed when the Shadow DOM changes', async () => {
    const element = withSlots();
    const reads = vi.fn(all);
    connectedContent(element, true, reads);
    reads.mockClear();
    const slot = document.createElement('slot');
    slot.append(item());

    element.shadowRoot!.append(slot);
    await flush();

    expect(reads).not.toHaveBeenCalled();
    element.remove();
  });

  it('stops observing the light DOM when the element is disconnected', async () => {
    const element = withSlots();
    const signal = connectedContent(element);
    element.remove();

    element.append(item());
    await flush();

    expect(signal()).toEqual([]);
  });
});

