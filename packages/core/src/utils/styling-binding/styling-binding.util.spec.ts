// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DIRECTIVE_ORDER, HEADER } from '../../costants';
import { HostAttribute } from '../../decorators/host-attribute/host-attribute.decorator';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { _Context } from '../../types/context.type';
import type { RenderElement } from '../../types/render-element.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';
import type { _RenderStyling } from '../../types/styling/render-styling.type';
import { _scope, clear, EMPTY_LAYOUT, refresh, update } from '../context/context.util';
import { _defineDirective } from '../directive-registry/directive-registry.util';
import { getElementSources } from '../element-sources/element-sources.util';
import { _bindHost } from '../host-bindings/host-bindings.util';
import { _hasStylingState, createStylingState } from '../styling-state/styling-state.util';
import { _internedStylingCount, _prepareStyling, _removeStyling, _setExpressionStyling, _setReactiveStyling, _setStyling, internStyling } from './styling-binding.util';

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
 * Describes a `div` of a template.
 */
const elementOf = (members: Omit<RenderElement, 'tagName'>): RenderElement => ({ tagName: 'div', ...members });

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
 * Creates the class of a directive declaring host attributes, as its decorators would.
 */
function directiveOf(properties: Record<string, string>, members: Record<string, unknown>): new () => CustomDirective {
  const metadata: DecoratorMetadataObject = {};
  for (const [member, name] of Object.entries(properties)) {
    (HostAttribute(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: member, static: false, metadata, access: { get: (owner: Record<string, unknown>) => owner[member] } });
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
 * Binds the host attributes of a directive on an element, as the runtime does once the directive is applied, with its
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
 * Binds host attributes as the component the element is: the owner is the element itself.
 */
function bindComponent(element: Element, properties: Record<string, string>, members: Record<string, unknown>): _Context {
  const metadata: DecoratorMetadataObject = {};
  for (const [member, name] of Object.entries(properties)) {
    (HostAttribute(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: member, static: false, metadata, access: { get: () => members[member] } });
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
  /**
   * Tells which attributes of an element are marked, so that its template keeps its binding there.
   */
  const marksOf = (element: Element) => [getElementSources(element)?.class === true, getElementSources(element)?.style === true];

  it('marks the attributes an element applying structural directives writes, and the ones its branches write', () => {
    const structural = document.createElement('div');
    _prepareStyling(structural, elementOf({ styling: 3, structuralDirectives: [{ selector: 'visible' }] }));
    expect(marksOf(structural)).toEqual([true, true]);

    const conditional = document.createElement('div');
    _prepareStyling(conditional, elementOf({ styling: 2, structuralConditionalBindings: [] }));
    expect(marksOf(conditional)).toEqual([false, false]);

    const branch = document.createElement('div');
    _prepareStyling(branch, elementOf({ styling: 3, conditionalBindings: [{ branches: [{ condition: () => true }, { condition: () => false, conditionalBindings: [{ branches: [{ condition: () => true, styling: 2 }] }] }] }] }));
    expect(marksOf(branch)).toEqual([false, true]);
  });

  it('marks the attributes the directives of the element and of its branches write with their host attributes', () => {
    _defineDirective('prepareStyling', directiveOf({ width: 'style.width.px' }, { width: 1 }));
    const element = document.createElement('div');
    _prepareStyling(element, elementOf({ styling: 12, directives: [{ selector: 'prepareStyling' }] }));
    expect(marksOf(element)).toEqual([false, true]);

    const branch = document.createElement('div');
    _prepareStyling(branch, elementOf({ styling: 3, conditionalBindings: [{ branches: [{ condition: () => true, directives: [{ selector: 'prepareStyling' }] }] }] }));
    expect(marksOf(branch)).toEqual([false, true]);

    // A directive applied by its class, one not registered yet
    const byClass = document.createElement('div');
    _prepareStyling(byClass, elementOf({ styling: 3, conditionalBindings: [{ branches: [{ condition: () => true, directives: [{ selector: directiveOf({ kind: 'class' }, {}) }] }] }] }));
    expect(marksOf(byClass)).toEqual([true, false]);
    const pending = document.createElement('div');
    _prepareStyling(pending, elementOf({ styling: 3, conditionalBindings: [{ branches: [{ condition: () => true, directives: [{ selector: 'not-registered-yet' }] }] }] }));
    expect(marksOf(pending)).toEqual([true, true]);
  });

  it('marks both attributes on a custom element not defined yet, none on a native element', () => {
    const custom = document.createElement('x-not-defined-yet');
    _prepareStyling(custom, elementOf({ styling: 12 }));
    expect(marksOf(custom)).toEqual([true, true]);

    const native = document.createElement('div');
    _prepareStyling(native, elementOf({ styling: 12 }));
    expect(getElementSources(native)).toBeUndefined();
  });

  it('marks the attributes a component writes with its host attributes or its host directives', () => {
    const Host = directiveOf({ kind: 'class' }, { kind: 'x' });
    const Plain = directiveOf({}, {});
    const metadata: DecoratorMetadataObject = { hostDirectives: [Plain, { directive: Host }] };
    const Component = class extends CustomElement { };
    Object.defineProperty(Component, Symbol.for('Symbol.metadata'), { value: metadata });
    customElements.define('x-prepare-styling', Component);
    const element = document.createElement('x-prepare-styling');
    _prepareStyling(element, elementOf({ styling: 12 }));
    expect(marksOf(element)).toEqual([true, false]);

    // The flags of the class are computed once
    const other = document.createElement('x-prepare-styling');
    _prepareStyling(other, elementOf({ styling: 4 }));
    expect(marksOf(other)).toEqual([true, false]);
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

describe('a state only for the keys two sources share', () => {
  /**
   * Renders the binding of the template of an element a directive writes, as `_renderElement` does: the element marked,
   * its binding run, then the directive bound.
   */
  function renderWith(styling: _RenderStyling, Directive: new () => CustomDirective): { element: Element, directive: _Context } {
    const selector = `lazy${Math.random()}`;
    _defineDirective(selector, Directive);
    const element = document.createElement('div');
    _prepareStyling(element, elementOf({ styling: styling.name === 'class' ? 4 : 8, directives: [{ selector }] }));
    _setReactiveStyling(scopeOf(styling), element, styling);
    return { element, directive: bindDirective(element, Directive, 0) };
  }

  it('writes the classes of the template and of a directive directly while they differ, the directive removing only its own', async () => {
    const on = signal(true);
    const { element, directive } = renderWith(stylingOf({ name: 'class', string: () => 'a b' }), directiveOf({ on: 'class.on' }, { on }));
    expect(element.className).toBe('a b on');
    expect(_hasStylingState(element, 'class')).toBe(false);

    on.set(false);
    await flush();
    expect(element.className).toBe('a b');
    expect(_hasStylingState(element, 'class')).toBe(false);

    on.set(true);
    await flush();
    clear(directive);
    expect(element.className).toBe('a b');
    expect(_hasStylingState(element, 'class')).toBe(false);
  });

  it('writes the properties of the template and of a directive directly while they differ, the directive removing only its own', () => {
    const { element, directive } = renderWith(stylingOf({ name: 'style', string: () => 'gap: 4px' }), directiveOf({ width: 'style.width.px' }, { width: 20 }));
    expect([styleOf(element).getPropertyValue('gap'), styleOf(element).getPropertyValue('width')]).toEqual(['4px', '20px']);
    expect(_hasStylingState(element, 'style')).toBe(false);

    clear(directive);
    expect([styleOf(element).getPropertyValue('gap'), styleOf(element).getPropertyValue('width')]).toEqual(['4px', '']);
    expect(_hasStylingState(element, 'style')).toBe(false);
  });

  it('creates the state when the string of the template gets a class the directive has an opinion on, the template winning', async () => {
    const kind = signal('a');
    const on = signal(false);
    const { element, directive } = renderWith(stylingOf({ name: 'class', string: () => kind() }), directiveOf({ on: 'class.on' }, { on }));
    expect(element.className).toBe('a');

    kind.set('a on');
    await flush();
    expect(element.className).toBe('a on');
    expect(_hasStylingState(element, 'class')).toBe(true);

    // The directive comes back for the class the template leaves, then goes, the class of the template staying
    kind.set('b');
    await flush();
    expect(element.className).toBe('b');
    on.set(true);
    await flush();
    expect(element.className).toBe('b on');
    kind.set('b on');
    await flush();
    clear(directive);
    expect(element.className).toBe('b on');
  });

  it('creates the state when a directive gets a property the template has an opinion on, the template winning, the directive coming back without it', async () => {
    const width = signal<string | null>(null);
    const { element } = renderWith(stylingOf({ name: 'style', string: () => width() }), directiveOf({ width: 'style.width.px' }, { width: 20 }));
    expect(styleOf(element).getPropertyValue('width')).toBe('20px');

    width.set('width: 30px');
    await flush();
    expect(styleOf(element).getPropertyValue('width')).toBe('30px');
    expect(_hasStylingState(element, 'style')).toBe(true);

    width.set(null);
    await flush();
    expect(styleOf(element).getPropertyValue('width')).toBe('20px');
  });

  it('creates the state when a directive gets a key the template has, written directly so far', async () => {
    const key = signal<string | null>(null);
    const { element } = renderWith(stylingOf({ name: 'class', string: () => 'a b' }), directiveOf({ kind: 'class' }, { kind: () => key() }));
    key.set('c');
    await flush();
    expect(_hasStylingState(element, 'class')).toBe(false);

    key.set('b');
    await flush();
    expect(element.className).toBe('a b');
    expect(_hasStylingState(element, 'class')).toBe(true);
  });

  it('gives back the level below when a source of a shared key is destroyed', () => {
    for (const attribute of ['class', 'style'] as const) {
      const element = document.createElement('div');
      const key = attribute === 'class' ? 'class.on' : 'style.width.px';
      bindComponent(element, { value: key }, { value: attribute === 'class' ? true : 10 });
      const directive = bindDirective(element, directiveOf({ value: key }, { value: attribute === 'class' ? false : 20 }), 0);
      expect(_hasStylingState(element, attribute)).toBe(true);
      expect(attribute === 'class' ? element.className : styleOf(element).getPropertyValue('width')).toBe(attribute === 'class' ? '' : '20px');

      clear(directive);
      expect(attribute === 'class' ? element.className : styleOf(element).getPropertyValue('width')).toBe(attribute === 'class' ? 'on' : '10px');
    }
  });

  it('keeps the values of a binding without slots in the sources of the element, as the one of an element applying structural directives', async () => {
    const kind = signal('a b');
    const element = document.createElement('div');
    _prepareStyling(element, elementOf({ styling: 3, structuralDirectives: [{ selector: 'visible' }] }));
    const styling: _RenderStyling = { name: 'class', string: () => kind(), setter: _setReactiveStyling };
    _setReactiveStyling(_scope(null, EMPTY_LAYOUT), element, styling);
    kind.set('b c');
    await flush();
    expect(element.className).toBe('b c');
    expect(getElementSources(element)!.class).toEqual({ site: styling, values: 'b c' });

    // Without values first, then with them
    const width = signal<string | undefined>(undefined);
    const structural = document.createElement('div');
    _prepareStyling(structural, elementOf({ styling: 3, structuralDirectives: [{ selector: 'visible' }] }));
    const style: _RenderStyling = { name: 'style', string: () => width(), setter: _setReactiveStyling };
    _setReactiveStyling(_scope(null, EMPTY_LAYOUT), structural, style);
    expect(getElementSources(structural)!.style).toBe(style);
    width.set('width: 1px');
    await flush();
    expect(styleOf(structural).getPropertyValue('width')).toBe('1px');

    // A static binding on an element merging its attributes too
    const statics = document.createElement('div');
    _prepareStyling(statics, elementOf({ styling: 3, structuralDirectives: [{ selector: 'visible' }] }));
    const binding: _RenderStyling = { name: 'class', text: 'a', statics: ['a', true], setter: _setStyling };
    _setStyling(_scope(null, EMPTY_LAYOUT), statics, binding);
    expect(getElementSources(statics)!.class).toBe(binding);
    bindComponent(statics, { a: 'class.a' }, { a: false });
    expect(statics.className).toBe('a');
    expect(_hasStylingState(statics, 'class')).toBe(true);
  });

  it('merges a branch, which keeps no slot, in a state created at its first write', () => {
    const element = document.createElement('div');
    const branch: _RenderStyling = { name: 'class', keys: ['on'], values: [() => true], setter: _setExpressionStyling, unbind: _removeStyling };
    _setExpressionStyling(_scope(null, EMPTY_LAYOUT), element, branch);
    expect(element.className).toBe('on');
    expect(_hasStylingState(element, 'class')).toBe(true);
  });
});

describe('the strings the slots keep', () => {
  it('are one copy per text, shared by the elements whose expressions compute it', () => {
    const classes = ['xd-grid-cell', 'xd-grid-align-end'];
    const styling = stylingOf({ name: 'class', string: () => classes.join(' ') });
    const first = scopeOf(styling);
    const second = scopeOf(styling);
    const before = _internedStylingCount();
    _setReactiveStyling(first, document.createElement('div'), styling);
    _setReactiveStyling(second, document.createElement('div'), styling);
    expect(_internedStylingCount()).toBe(before + 1);
    expect(first[HEADER + 3]).toBe('xd-grid-cell xd-grid-align-end');
    expect(second[HEADER + 3]).toBe(internStyling(classes.join(' ')));
    expect((second[HEADER + 2] as Element).className).toBe('xd-grid-cell xd-grid-align-end');

    // The strings of a binding keeping more values, the other values kept as they are
    const both = stylingOf({ name: 'style', string: () => ['top', '1px'].join(': '), keys: ['width'], values: [() => 2], units: ['px'] });
    const scope = scopeOf(both);
    _setReactiveStyling(scope, document.createElement('div'), both);
    expect(scope[HEADER + 3]).toEqual(['top: 1px', 2]);
    expect(_internedStylingCount()).toBe(before + 2);
  });

  it('are kept as they are once the cache is full, which keeps the ones it holds', () => {
    internStyling('held');
    for (let i = 0; _internedStylingCount() < 512; i++) {
      internStyling(`filler-${i}`);
    }

    const fresh = ['not', 'held'].join(' ');
    expect(internStyling(fresh)).toBe(fresh);
    expect(internStyling(['not', 'held'].join(' '))).toBe('not held');
    expect(internStyling('held')).toBe('held');
    expect(internStyling(null)).toBeNull();
    expect(_internedStylingCount()).toBe(512);
  });
});
