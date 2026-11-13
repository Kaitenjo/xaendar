// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DIRECTIVE_ORDER, HEADER } from '../../costants';
import { HostProperty } from '../../decorators/host-property/host-property.decorator';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { _Context } from '../../types/context.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';
import type { _RenderStyling } from '../../types/styling/render-styling.type';
import { _scope, clear, EMPTY_LAYOUT, refresh, update } from '../context/context.util';
import { _defineDirective } from '../directive-registry/directive-registry.util';
import { _bindHost } from '../host-bindings/host-bindings.util';
import { _hasStylingState, createStylingState } from '../styling-state/styling-state.util';
import { _prepareStyling, _removeStyling, _setExpressionStyling, _setReactiveStyling, _setStyling } from './styling-binding.util';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { signal } = await import('../../signals/signal/signal');
const { CustomElement } = await import('../../models/custom-element/custom-element');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/**
 * The style of an element.
 */
const styleOf = (element: Element) => (element as HTMLElement).style;

/**
 * Describes a binding of `class` or `style` as the compiler writes it, with the slots of a compiled scope.
 */
function stylingOf(styling: Omit<_RenderStyling, 'setter' | 'effect' | 'target' | 'indexed'>): _RenderStyling {
  return { ...styling, setter: _setReactiveStyling, update: _setExpressionStyling, effect: 0, target: 1, indexed: true };
}

/**
 * Creates a compiled scope holding the slots of one binding (the effect, the element, the values), after a variable.
 */
function scopeOf(styling: _RenderStyling): _Context {
  const layout: _ScopeLayout = { size: HEADER + 4, nodes: HEADER + 1, bindings: HEADER + 1, sites: [styling], variables: ['kind'] };
  return _scope(null, layout);
}

/**
 * Creates the class of a directive declaring host properties, as its decorators would.
 */
function directiveOf(properties: Record<string, string>, members: Record<string, unknown>): new () => CustomDirective {
  const metadata: DecoratorMetadataObject = {};
  for (const [member, name] of Object.entries(properties)) {
    (HostProperty(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: member, static: false, metadata, access: { get: (owner: Record<string, unknown>) => owner[member] } });
  }

  const Klass = class extends CustomDirective {
    constructor() {
      super();
      Object.assign(this, members);
    }
  };
  Object.defineProperty(Klass, Symbol.for('Symbol.metadata'), { value: metadata });
  return Klass;
}

/**
 * Binds the host properties of a directive on an element, as the runtime does once the directive is applied, with its
 * order among the directives of the element.
 */
function bindDirective(element: Element, Directive: new () => CustomDirective, order: number): _Context {
  const directive = new Directive();
  directive[DIRECTIVE_ORDER] = order;
  const context = _scope(null, EMPTY_LAYOUT);
  _bindHost(directive, element, context);
  return context;
}

/**
 * Binds host properties as the component the element is: the owner is the element itself.
 */
function bindComponent(element: Element, properties: Record<string, string>, members: Record<string, unknown>): _Context {
  const metadata: DecoratorMetadataObject = {};
  for (const [member, name] of Object.entries(properties)) {
    (HostProperty(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: member, static: false, metadata, access: { get: () => members[member] } });
  }

  Object.defineProperty(element, 'constructor', { value: { [Symbol.for('Symbol.metadata')]: metadata } });
  const context = _scope(null, EMPTY_LAYOUT);
  _bindHost(element as unknown as CustomDirective, element, context);
  return context;
}

describe('_setStyling', () => {
  it('writes a static string at once on an element without the attribute', () => {
    const element = document.createElement('div');
    const setAttribute = vi.spyOn(element, 'setAttribute');
    _setStyling(_scope(null, EMPTY_LAYOUT), element, { name: 'class', text: 'a b', statics: ['a', true, 'b', true], setter: _setStyling });
    expect(setAttribute).toHaveBeenCalledWith('class', 'a b');
    expect(_hasStylingState(element, 'class')).toBe(false);
  });

  it('writes nothing on an element adopted from the server holding the value', () => {
    const element = document.createElement('div');
    element.setAttribute('style', 'display: flex; gap: 4px;');
    element.setAttribute('class', 'b a');
    const observer = new MutationObserver(() => undefined);
    observer.observe(element, { attributes: true });
    _setStyling(_scope(null, EMPTY_LAYOUT), element, { name: 'style', text: 'display: flex; gap: 4px', statics: ['display', 'flex', 'gap', '4px'], setter: _setStyling });
    _setStyling(_scope(null, EMPTY_LAYOUT), element, { name: 'class', text: 'a b', statics: ['a', true, 'b', true], setter: _setStyling });
    expect(observer.takeRecords()).toEqual([]);
  });

  it('completes an adopted element missing a key', () => {
    const element = document.createElement('div');
    element.setAttribute('class', 'a');
    _setStyling(_scope(null, EMPTY_LAYOUT), element, { name: 'class', text: 'a b', statics: ['a', true, 'b', true], setter: _setStyling });
    expect(element.className).toBe('a b');
  });
});

describe('_setExpressionStyling', () => {
  it('writes the values of expressions read once, the keys winning over the string', () => {
    const element = document.createElement('div');
    _setExpressionStyling(_scope(null, EMPTY_LAYOUT), element, {
      name: 'class',
      string: () => 'card active',
      keys: ['active', 'wide'],
      values: [() => false, () => 1],
      setter: _setExpressionStyling
    });
    expect(element.className).toBe('card wide');
  });

  it('writes a single key, with its unit', () => {
    const element = document.createElement('div');
    _setExpressionStyling(_scope(null, EMPTY_LAYOUT), element, { name: 'style', keys: ['width'], values: [() => 10], units: ['px'], setter: _setExpressionStyling });
    expect(styleOf(element).getPropertyValue('width')).toBe('10px');
  });

  it('writes nothing for a binding without opinion', () => {
    const element = document.createElement('div');
    _setExpressionStyling(_scope(null, EMPTY_LAYOUT), element, { name: 'class', string: () => null, setter: _setExpressionStyling });
    expect(element.hasAttribute('class')).toBe(false);
  });
});

describe('_setReactiveStyling', () => {
  it('writes again only the keys whose value changes, keeping its values in its slots and no state', async () => {
    const kind = signal<string | null>('card a');
    const active = signal<unknown>(true);
    const styling = stylingOf({ name: 'class', string: () => kind(), keys: ['active'], values: [() => active()] });
    const scope = scopeOf(styling);
    const element = document.createElement('div');
    _setReactiveStyling(scope, element, styling);
    expect(element.className).toBe('card a active');
    expect(scope[HEADER + 2]).toBe(element);
    expect(scope[HEADER + 3]).toEqual(['card a', true]);

    element.classList.add('external');
    kind.set('card b');
    active.set(null);
    await flush();
    expect(element.className).toBe('card external b');
    expect(_hasStylingState(element, 'class')).toBe(false);

    kind.set(null);
    await flush();
    expect(element.className).toBe('external');
  });

  it('keeps null for a single value undefined, so that the next run compares with it', async () => {
    const width = signal<number | undefined>(undefined);
    const styling = stylingOf({ name: 'style', keys: ['width'], values: [() => width()], units: ['px'] });
    const scope = scopeOf(styling);
    const element = document.createElement('div');
    _setReactiveStyling(scope, element, styling);
    expect(scope[HEADER + 3]).toBeNull();

    width.set(5);
    await flush();
    expect(styleOf(element).getPropertyValue('width')).toBe('5px');
  });

  it('runs again when a variable it reads changes', () => {
    const styling = { ...stylingOf({ name: 'style', string: (context: _Context) => `color: ${String(context[HEADER])}` }), reads: [0] };
    const scope = scopeOf(styling);
    scope[HEADER] = 'red';
    const element = document.createElement('div');
    _setReactiveStyling(scope, element, styling);
    expect(styleOf(element).getPropertyValue('color')).toBe('red');

    update(scope, HEADER, 'blue');
    refresh(scope, [0]);
    expect(styleOf(element).getPropertyValue('color')).toBe('blue');
  });

  it('is a source of the state of the element when it has one, also without slots', () => {
    const element = document.createElement('div');
    createStylingState(element, 'class');
    const styling: _RenderStyling = { name: 'class', string: () => 'a', setter: _setReactiveStyling };
    const scope = _scope(null, EMPTY_LAYOUT);
    _setReactiveStyling(scope, element, styling);
    expect(element.className).toBe('a');

    _removeStyling(scope, element, styling);
    expect(element.className).toBe('');
  });
});

describe('_removeStyling', () => {
  it('does nothing on an element without state', () => {
    const element = document.createElement('div');
    element.className = 'a';
    _removeStyling(_scope(null, EMPTY_LAYOUT), element, { name: 'class', text: 'a', statics: ['a', true], setter: _setStyling });
    expect(element.className).toBe('a');
  });
});

describe('_prepareStyling', () => {
  it('creates the states the flags of the compiler ask for', () => {
    const element = document.createElement('div');
    _prepareStyling(element, 2);
    expect(_hasStylingState(element, 'class')).toBe(false);
    expect(_hasStylingState(element, 'style')).toBe(true);
  });

  it('creates the states of the attributes the directives of the element write with their host properties', () => {
    const Directive = directiveOf({ width: 'style.width.px' }, { width: 1 });
    _defineDirective('prepareStyling', Directive);
    const element = document.createElement('div');
    _prepareStyling(element, 12, [{ selector: 'prepareStyling' }]);
    expect(_hasStylingState(element, 'class')).toBe(false);
    expect(_hasStylingState(element, 'style')).toBe(true);
  });

  it('creates both states on a custom element not defined yet, none on a native element', () => {
    const custom = document.createElement('x-not-defined-yet');
    _prepareStyling(custom, 12);
    expect(_hasStylingState(custom, 'class')).toBe(true);
    expect(_hasStylingState(custom, 'style')).toBe(true);

    const native = document.createElement('div');
    _prepareStyling(native, 12);
    expect(_hasStylingState(native, 'class')).toBe(false);
  });

  it('creates the states of the attributes a component writes with its host properties or its host directives', () => {
    const Host = directiveOf({ kind: 'class' }, { kind: 'x' });
    const Plain = directiveOf({}, {});
    const metadata: DecoratorMetadataObject = { hostDirectives: [Plain, { directive: Host }] };
    const Component = class extends CustomElement { };
    Object.defineProperty(Component, Symbol.for('Symbol.metadata'), { value: metadata });
    customElements.define('x-prepare-styling', Component);
    const element = document.createElement('x-prepare-styling');
    _prepareStyling(element, 12);
    expect(_hasStylingState(element, 'class')).toBe(true);
    expect(_hasStylingState(element, 'style')).toBe(false);

    // The flags of the class are computed once
    const other = document.createElement('x-prepare-styling');
    _prepareStyling(other, 4);
    expect(_hasStylingState(other, 'class')).toBe(true);
  });
});

describe('merging the template, the directives and the component', () => {
  it('lets the template win over the directives over the component, and gives back the value below when a level has no opinion', async () => {
    const width = signal<number | null>(30);
    const styling = stylingOf({ name: 'style', string: () => 'gap: 4px', keys: ['width'], values: [() => width()], units: ['px'] });
    const scope = scopeOf(styling);
    const element = document.createElement('div');
    createStylingState(element, 'style');
    bindComponent(element, { layout: 'style', width: 'style.width.px' }, { layout: 'display: flex; gap: 1px', width: 10 });
    const directive = bindDirective(element, directiveOf({ width: 'style.width.px' }, { width: 20 }), 0);
    _setReactiveStyling(scope, element, styling);
    expect([styleOf(element).getPropertyValue('display'), styleOf(element).getPropertyValue('gap'), styleOf(element).getPropertyValue('width')]).toEqual(['flex', '4px', '30px']);

    width.set(null);
    await flush();
    expect(styleOf(element).getPropertyValue('width')).toBe('20px');

    clear(directive);
    expect(styleOf(element).getPropertyValue('width')).toBe('10px');
  });

  it('removes a class the template makes absent, even if the component makes it present, and keeps it when it has no opinion', async () => {
    const on = signal<boolean | null>(false);
    const styling = stylingOf({ name: 'class', keys: ['on'], values: [() => on()] });
    const scope = scopeOf(styling);
    const element = document.createElement('div');
    createStylingState(element, 'class');
    _setReactiveStyling(scope, element, styling);
    bindComponent(element, { kind: 'class' }, { kind: 'on base' });
    expect(element.className).toBe('base');

    on.set(null);
    await flush();
    expect(element.className).toBe('base on');
  });

  it('lets the directive applied later win, the host directives coming before the ones of the template', () => {
    const element = document.createElement('div');
    bindDirective(element, directiveOf({ color: 'style.color' }, { color: 'blue' }), 1);
    bindDirective(element, directiveOf({ color: 'style.color', size: 'style.fontSize.px' }, { color: 'red', size: 12 }), 0);
    expect(_hasStylingState(element, 'style')).toBe(true);
    expect(styleOf(element).getPropertyValue('color')).toBe('blue');
    expect(styleOf(element).getPropertyValue('font-size')).toBe('12px');
  });

  it('writes the component alone directly, without state', async () => {
    const element = document.createElement('div');
    const off = signal(false);
    const context = bindComponent(element, { kind: 'class', off: 'class.off' }, { kind: 'a off', off });
    expect(element.className).toBe('a');

    off.set(true);
    await flush();
    expect(element.className).toBe('a off');
    expect(_hasStylingState(element, 'class')).toBe(false);

    clear(context);
    expect(element.className).toBe('');
  });
});
