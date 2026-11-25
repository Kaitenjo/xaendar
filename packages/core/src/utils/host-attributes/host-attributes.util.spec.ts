// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DIRECTIVE_ORDER, INTERNAL_HOST_ATTRIBUTES } from '../../costants';
import { HostAttribute } from '../../decorators/host-attribute/host-attribute.decorator';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { _Context } from '../../types/context.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { _hasAttributeState, _mergeAttributes } from '../attribute-state/attribute-state.util';
import { _scope, clear, EMPTY_LAYOUT } from '../context/context.util';
import { _applyHostAttributes, _bindHost } from '../host-bindings/host-bindings.util';
import { _hostAttributeNames } from './host-attributes.util';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { signal } = await import('../../signals/signal/signal');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/**
 * Builds the metadata of a class declaring host attributes, as its decorators would.
 */
function metadataOf(properties: Record<string, string>, members: Record<string, unknown>): DecoratorMetadataObject {
  const metadata: DecoratorMetadataObject = {};
  for (const [member, name] of Object.entries(properties)) {
    (HostAttribute(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: member, static: false, metadata, access: { get: () => members[member] } });
  }

  return metadata;
}

/**
 * Binds the host attributes of a directive on an element, as the runtime does once the directive is applied, with its
 * order among the directives of the element.
 */
function bindDirective(element: Element, properties: Record<string, string>, members: Record<string, unknown>, order: number): _Context {
  const Directive = class extends CustomDirective { };
  Object.defineProperty(Directive, Symbol.for('Symbol.metadata'), { value: metadataOf(properties, members) });
  const directive = new Directive();
  directive[DIRECTIVE_ORDER] = order;
  const context = _scope(null, EMPTY_LAYOUT);
  _bindHost(directive, element, context);
  return context;
}

/**
 * Binds host attributes as the component the element is: the owner is the element itself.
 */
function bindComponent(element: Element, properties: Record<string, string>, members: Record<string, unknown>): _Context {
  Object.defineProperty(element, 'constructor', { value: { [Symbol.for('Symbol.metadata')]: metadataOf(properties, members) } });
  const context = _scope(null, EMPTY_LAYOUT);
  _bindHost(element as unknown as CustomDirective, element, context);
  return context;
}

describe('host attributes of attributes', () => {
  it('writes the attributes of a single owner directly, again when a signal changes, and removes the ones it wrote', async () => {
    const element = document.createElement('div');
    const label = signal<string | null>('Close');
    const context = bindComponent(element, { label: 'aria-label', role: 'role', pressed: 'aria-pressed' }, { label, role: 'button', pressed: false });
    expect([element.getAttribute('aria-label'), element.getAttribute('role'), element.getAttribute('aria-pressed')]).toEqual(['Close', 'button', 'false']);
    expect(_hasAttributeState(element, 'role')).toBe(false);

    label.set(null);
    await flush();
    expect(element.hasAttribute('aria-label')).toBe(false);

    // A value other code wrote since stays
    element.setAttribute('role', 'link');
    clear(context);
    expect(element.getAttribute('role')).toBe('link');
    expect(element.hasAttribute('aria-pressed')).toBe(false);
  });

  it('lets the directive of the higher rank win over the component, in any order the owners are bound, and gives back the value below when one is destroyed', () => {
    const binders: Array<(element: Element) => _Context> = [
      element => bindComponent(element, { id: 'id' }, { id: 'component' }),
      element => bindDirective(element, { id: 'id' }, { id: 'first' }, 0),
      element => bindDirective(element, { id: 'id' }, { id: 'second' }, 1)
    ];
    const orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (let i = 0; i < orders.length; i++) {
      const element = document.createElement('div');
      const contexts = orders[i].map(index => binders[index](element));
      expect(element.getAttribute('id')).toBe('second');
      expect(_hasAttributeState(element, 'id')).toBe(true);

      clear(contexts[orders[i].indexOf(2)]);
      expect(element.getAttribute('id')).toBe('first');
      clear(contexts[orders[i].indexOf(1)]);
      expect(element.getAttribute('id')).toBe('component');
      clear(contexts[orders[i].indexOf(0)]);
      expect(element.hasAttribute('id')).toBe(false);
    }
  });

  it('gives a directive without opinion the value of the component, false of the directive removing it', async () => {
    const element = document.createElement('div');
    const hidden = signal<boolean | null>(null);
    bindComponent(element, { hidden: 'hidden' }, { hidden: true });
    bindDirective(element, { hidden: 'hidden' }, { hidden }, 0);
    expect(element.getAttribute('hidden')).toBe('');

    hidden.set(false);
    await flush();
    expect(element.hasAttribute('hidden')).toBe(false);
  });

  it('writes once, through the state of an element merging all of them, as the server does', () => {
    const element = document.createElement('div');
    _mergeAttributes(element);
    const Directive = class extends CustomDirective { };
    Object.defineProperty(Directive, Symbol.for('Symbol.metadata'), { value: metadataOf({ id: 'id' }, { id: 'directive' }) });
    const directive = new Directive();
    Object.defineProperty(element, 'constructor', { value: { [Symbol.for('Symbol.metadata')]: metadataOf({ id: 'id', role: 'role' }, { id: 'component', role: 'note' }) } });
    // The component first: the directive wins all the same
    _applyHostAttributes(element as unknown as CustomDirective, element);
    _applyHostAttributes(directive, element);
    expect(element.getAttribute('id')).toBe('directive');
    expect(element.getAttribute('role')).toBe('note');
  });

  it('checks the URLs it writes, as the security of the project asks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const link = document.createElement('a');
    bindDirective(link, { href: 'href' }, { href: 'javascript:alert(1)' }, 0);
    expect(link.hasAttribute('href')).toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Xaendar: the URL bound to href runs code (javascript:alert(1))'));
    warn.mockRestore();
  });

  it('rejects an attribute lifting a restriction of its element', () => {
    const frame = document.createElement('iframe');
    expect(() => bindDirective(frame, { flags: 'sandbox' }, { flags: 'allow-scripts' }, 0)).toThrow('@HostAttribute(\'sandbox\') on <iframe> sets a restriction of the <iframe> from a value of the application, which the browser applies only to the page it loads next: write it as a static attribute, or set "security": { "rejectUnsafeBindings": false } in xaendar.json to allow it.');

    const animation = document.createElementNS('http://www.w3.org/2000/svg', 'set');
    animation.setAttribute('attributeName', 'href');
    expect(() => bindDirective(animation, { to: 'to' }, { to: 'javascript:alert(1)' }, 0)).toThrow('@HostAttribute(\'to\') on <set> writes into href a value of the application');
    expect(() => bindDirective(document.createElement('div'), { flags: 'sandbox' }, { flags: 'a' }, 0)).not.toThrow();
  });
});

describe('host attributes with the security of a project allowing everything', () => {
  it('neither rejects nor checks what the security of the project does not ask for', async () => {
    vi.stubGlobal('__XAENDAR_SECURITY__', { urls: 'off', resourceUrls: 'off', trustedOrigins: [], rejectUnsafeBindings: false });
    vi.resetModules();
    const { HostAttribute: hostAttribute } = await import('../../decorators/host-attribute/host-attribute.decorator');
    const { registerHostAttributes, applyHostAttribute } = await import('./host-attributes.util');
    const { HostAttributeRun } = await import('../../models/host-attribute-run/host-attribute-run');
    const metadata: DecoratorMetadataObject = {};
    (hostAttribute('sandbox') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'flags', static: false, metadata, access: { get: () => 'allow-scripts' } });
    (hostAttribute('onload') as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'code', static: false, metadata, access: { get: () => 'init()' } });

    const frame = document.createElement('iframe');
    const run = new HostAttributeRun({} as never, frame, (metadata as WebComponentMetadata)[INTERNAL_HOST_ATTRIBUTES]!, 0);
    registerHostAttributes(run);
    applyHostAttribute(run, 0);
    applyHostAttribute(run, 1);
    expect([frame.getAttribute('sandbox'), frame.getAttribute('onload')]).toEqual(['allow-scripts', 'init()']);
    vi.unstubAllGlobals();
    vi.resetModules();
  });
});

describe('_hostAttributeNames', () => {
  it('lists the attributes a class writes, other than class and style, and the ones of its host directives, once per class', () => {
    const Host = class { };
    Object.defineProperty(Host, Symbol.for('Symbol.metadata'), { value: metadataOf({ id: 'id', kind: 'class', role: 'role' }, {}) });
    const Plain = class { };
    const Component = class { };
    Object.defineProperty(Component, Symbol.for('Symbol.metadata'), { value: Object.assign(metadataOf({ title: 'title', again: 'role' }, {}), { hostDirectives: [Plain, { directive: Host }] }) });
    expect(_hostAttributeNames(Component)).toEqual(['title', 'role', 'id']);
    expect(_hostAttributeNames(Component)).toBe(_hostAttributeNames(Component));
    expect(_hostAttributeNames(Plain)).toBeNull();
  });
});
