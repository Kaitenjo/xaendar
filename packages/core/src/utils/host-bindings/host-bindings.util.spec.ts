// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { HostListener } from '../../decorators/host-listener/host-listener.decorator';
import { HostProperty } from '../../decorators/host-property/host-property.decorator';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { _hasStylingState } from '../styling-state/styling-state.util';
import { EMPTY_LAYOUT, _scope, clear } from '../context/context.util';
import type { _Context } from '../../types/context.type';
import { _applyHostProperties, _bindHost } from './host-bindings.util';
import { CLEANUP } from '../../costants';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { signal } = await import('../../signals/signal/signal');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/**
 * A directive whose members are bound by the tests.
 */
class Owner extends CustomDirective { }

/**
 * Creates an owner of a new class whose members are the given ones, decorated as `bindings` and `listeners` declare,
 * with the decorators applied as a class applies them.
 */
function createOwner(members: Record<string, unknown>, bindings: Record<string, string>, listeners: Record<string, [string, AddEventListenerOptions?]> = {}): Owner {
  const metadata: DecoratorMetadataObject = {};
  const access = (member: string) => ({ get: (owner: Record<string, unknown>) => owner[member] });
  for (const [member, name] of Object.entries(bindings)) {
    (HostProperty(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: member, static: false, metadata, access: access(member) });
  }
  for (const [member, [name, options]] of Object.entries(listeners)) {
    (HostListener(name, options) as unknown as (value: unknown, context: unknown) => void)(members[member], { kind: 'method', name: member, static: false, metadata, access: access(member) });
  }

  const Klass = class extends Owner { };
  Object.defineProperty(Klass, Symbol.for('Symbol.metadata'), { value: metadata });

  // The descriptors are copied, so that a getter stays a getter
  return Object.defineProperties(new Klass(), Object.getOwnPropertyDescriptors(members));
}

/**
 * Binds the host element of an owner in a new context, returning the element and the context.
 */
function bind(owner: Owner, element: Element = document.createElement('div')) {
  const context = _scope(null, EMPTY_LAYOUT);
  _bindHost(owner, element, context);

  return { element, context };
}

describe('_bindHost', () => {
  it('binds nothing for a class declaring no host binding', () => {
    const { element, context } = bind(new (class extends Owner { })());

    expect(element.attributes).toHaveLength(0);
    expect(context[CLEANUP]).toBeNull();
  });

  it('writes the attributes: null, undefined and false remove them, true writes them empty, other values as strings', () => {
    const element = document.createElement('div');
    element.setAttribute('hidden', '');
    element.setAttribute('title', 'old');
    const owner = createOwner(
      { role: 'switch', tabindex: 0, disabled: true, hidden: false, title: null, label: undefined },
      { role: 'role', tabindex: 'tabindex', disabled: 'disabled', hidden: 'hidden', title: 'title', label: 'aria-label' }
    );
    bind(owner, element);

    expect(element.getAttribute('role')).toBe('switch');
    expect(element.getAttribute('tabindex')).toBe('0');
    expect(element.getAttribute('disabled')).toBe('');
    expect(element.hasAttribute('hidden')).toBe(false);
    expect(element.hasAttribute('title')).toBe(false);
    expect(element.hasAttribute('aria-label')).toBe(false);
  });

  it('writes again a member reading a signal, and calls a member holding one', async () => {
    const checked = signal(false);
    const owner = createOwner({ checked, get label() { return checked() ? 'On' : 'Off'; } }, { checked: 'aria-checked', label: 'aria-label' });
    const { element } = bind(owner);
    expect(element.getAttribute('aria-checked')).toBe('false');
    expect(element.getAttribute('aria-label')).toBe('Off');

    checked.set(true);
    await flush();
    expect(element.getAttribute('aria-checked')).toBe('true');
    expect(element.getAttribute('aria-label')).toBe('On');
  });

  it('writes the string of class and toggles a class while the value is truthy, the class winning over the string, without a state', async () => {
    const active = signal<unknown>(1);
    const owner = createOwner({ active, kind: 'tall active' }, { active: 'class.active', kind: 'class' });
    const { element } = bind(owner);
    expect(element.className).toBe('tall active');
    expect(_hasStylingState(element, 'class')).toBe(false);

    active.set(0);
    await flush();
    expect(element.className).toBe('tall');

    active.set(null);
    await flush();
    expect(element.className).toBe('tall active');
  });

  it('sets a style property followed by its unit, removing it for null and when the context is cleared', async () => {
    const width = signal<number | null>(120);
    const owner = createOwner({ width, color: 'red' }, { width: 'style.width.px', color: 'style.backgroundColor' });
    const { element, context } = bind(owner);
    const { style } = element as HTMLElement;
    expect(style.getPropertyValue('width')).toBe('120px');
    expect(style.getPropertyValue('background-color')).toBe('red');

    width.set(null);
    await flush();
    expect(style.getPropertyValue('width')).toBe('');

    clear(context);
    expect(style.getPropertyValue('background-color')).toBe('');
  });

  it('leaves the classes and the properties other code wrote, also when the context is cleared', () => {
    const element = document.createElement('div');
    element.classList.add('selected');
    (element as HTMLElement).style.setProperty('color', 'red');
    const { context } = bind(createOwner({ kind: 'card', layout: 'display: flex' }, { kind: 'class', layout: 'style' }), element);
    expect(element.className).toBe('selected card');
    expect((element as HTMLElement).style.getPropertyValue('display')).toBe('flex');

    clear(context);
    expect(element.className).toBe('selected');
    expect((element as HTMLElement).style.getPropertyValue('color')).toBe('red');
    expect((element as HTMLElement).style.getPropertyValue('display')).toBe('');
  });

  it('removes the attributes and the classes, and stops writing them, when the context is cleared', async () => {
    const label = signal('One');
    const owner = createOwner({ label, on: true }, { label: 'aria-label', on: 'class.on' });
    const { element, context } = bind(owner);

    clear(context);
    expect(element.hasAttribute('aria-label')).toBe(false);
    expect(element.classList.contains('on')).toBe(false);

    label.set('Two');
    await flush();
    expect(element.hasAttribute('aria-label')).toBe(false);
  });

  it('listens to the events with the decorated methods, called on the owner with the event, until the context is cleared', () => {
    const calls = new Array<[unknown, Event]>();
    const owner = createOwner({ handle(this: unknown, event: Event) { calls.push([this, event]); } }, {}, { handle: ['ping'] });
    const { element, context } = bind(owner);

    const event = new Event('ping');
    element.dispatchEvent(event);
    expect(calls).toEqual([[owner, event]]);

    clear(context);
    element.dispatchEvent(new Event('ping'));
    expect(calls).toHaveLength(1);
  });

  it('adds and removes the listeners with their options', () => {
    const element = document.createElement('div');
    const add = vi.spyOn(element, 'addEventListener');
    const remove = vi.spyOn(element, 'removeEventListener');
    const { context } = bind(createOwner({ handle: () => undefined }, {}, { handle: ['click', { capture: true, passive: true }] }), element);

    expect(add).toHaveBeenCalledWith('click', expect.any(Function), { capture: true, passive: true });

    clear(context);
    expect(remove).toHaveBeenCalledWith('click', add.mock.calls[0][1], { capture: true, passive: true });
  });

  it('listens to the events of the window and of the document, not of the element, until the context is cleared', () => {
    const calls = new Array<string>();
    const owner = createOwner(
      { onResize(event: Event) { calls.push(`window ${event.type}`); }, onKeydown(event: Event) { calls.push(`document ${event.type}`); } },
      {},
      { onResize: ['window:resize'], onKeydown: ['document:keydown', { capture: true }] }
    );
    const { element, context } = bind(owner);

    element.dispatchEvent(new Event('resize'));
    element.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new Event('keydown'));
    expect(calls).toEqual(['window resize', 'document keydown']);

    clear(context);
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new Event('keydown'));
    expect(calls).toHaveLength(2);
  });
});

describe('_applyHostProperties', () => {
  it('writes the classes and the style alone, or the attributes alone, the same class writing them again', () => {
    const Styled = class extends Owner { };
    const metadata: DecoratorMetadataObject = {};
    (HostProperty('style') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'layout', static: false, metadata, access: { get: () => 'display: flex' } });
    (HostProperty('class.on') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'on', static: false, metadata, access: { get: () => true } });
    Object.defineProperty(Styled, Symbol.for('Symbol.metadata'), { value: metadata });
    for (let i = 0; i < 2; i++) {
      const element = document.createElement('div');
      _applyHostProperties(new Styled(), element);
      expect(element.getAttribute('style')).toBe('display: flex;');
      expect(element.className).toBe('on');
    }

    const element = document.createElement('div');
    _applyHostProperties(createOwner({ role: 'switch' }, { role: 'role' }), element);
    expect(element.getAttribute('role')).toBe('switch');
    expect(element.hasAttribute('class')).toBe(false);
  });

  it('writes the attributes and toggles the classes once, without binding them, and leaves the events alone', async () => {
    const label = signal('One');
    const add = vi.fn();
    const owner = createOwner({ label, on: true, disabled: false, handle: () => undefined }, { label: 'aria-label', on: 'class.on', disabled: 'disabled' }, { handle: ['click'] });
    const element = document.createElement('div');
    element.setAttribute('disabled', '');
    element.addEventListener = add;

    _applyHostProperties(owner, element);
    expect(element.getAttribute('aria-label')).toBe('One');
    expect(element.className).toBe('on');
    expect(element.hasAttribute('disabled')).toBe(false);
    expect(add).not.toHaveBeenCalled();

    label.set('Two');
    await flush();
    expect(element.getAttribute('aria-label')).toBe('One');
  });

  it('writes nothing for a class declaring no host property', () => {
    const element = document.createElement('div');

    _applyHostProperties(new (class extends Owner { })(), element);

    expect(element.attributes).toHaveLength(0);
  });
});
