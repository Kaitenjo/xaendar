// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { HostEvent } from '../../decorators/host-event/host-event.decorator';
import { HostProperty } from '../../decorators/host-property/host-property.decorator';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { toggleClass } from '../class-toggle/class-toggle.util';
import { _Context } from '../context/context.util';
import { _applyHostProperties, _bindHost } from './host-bindings.util';

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
    (HostEvent(name, options) as unknown as (value: unknown, context: unknown) => void)(members[member], { kind: 'method', name: member, static: false, metadata, access: access(member) });
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
  const context = new _Context({} as never);
  _bindHost(owner, element, context);

  return { element, context };
}

describe('_bindHost', () => {
  it('binds nothing for a class declaring no host binding', () => {
    const { element, context } = bind(new (class extends Owner { })());

    expect(element.attributes).toHaveLength(0);
    expect(context.getUnlistenFns()).toHaveLength(0);
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
    expect(element.hasAttribute('aria-checked')).toBe(false);
    expect(element.getAttribute('aria-label')).toBe('Off');

    checked.set(true);
    await flush();
    expect(element.getAttribute('aria-checked')).toBe('');
    expect(element.getAttribute('aria-label')).toBe('On');
  });

  it('toggles a class while the value is truthy, keeping it when the class attribute is written', async () => {
    const active = signal(1);
    const owner = createOwner({ active, kind: 'tall' }, { active: 'class.active', kind: 'class' });
    const { element } = bind(owner);
    expect(element.className).toBe('tall active');

    active.set(0);
    await flush();
    expect(element.classList.contains('active')).toBe(false);
  });

  it('keeps the classes of the class bindings when it writes the class attribute', () => {
    const element = document.createElement('div');
    toggleClass(element, 'selected', true);
    bind(createOwner({ kind: 'card' }, { kind: 'class' }), element);

    expect(element.className).toBe('card selected');
  });

  it('removes the attributes and the classes, and stops writing them, when the context is cleared', async () => {
    const label = signal('One');
    const owner = createOwner({ label, on: true }, { label: 'aria-label', on: 'class.on' });
    const { element, context } = bind(owner);

    context.clear();
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

    context.clear();
    element.dispatchEvent(new Event('ping'));
    expect(calls).toHaveLength(1);
  });

  it('adds and removes the listeners with their options', () => {
    const element = document.createElement('div');
    const add = vi.spyOn(element, 'addEventListener');
    const remove = vi.spyOn(element, 'removeEventListener');
    const { context } = bind(createOwner({ handle: () => undefined }, {}, { handle: ['click', { capture: true, passive: true }] }), element);

    expect(add).toHaveBeenCalledWith('click', expect.any(Function), { capture: true, passive: true });

    context.clear();
    expect(remove).toHaveBeenCalledWith('click', add.mock.calls[0][1], { capture: true, passive: true });
  });
});

describe('_applyHostProperties', () => {
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
