// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { StylingSource } from '../../types/styling/styling-source.type';
import type { StylingTier } from '../../types/styling/styling-tier.type';
import { _hasStylingState, addHostStylingSource, applyDirectStyling, createStylingState, ensureStylingState, findStylingSource, getStylingState, hasHostStylingSources, removeHostStylingSource, removeStylingSource, resolveOpinion, setStylingSource, writeStylingAttribute } from './styling-state.util';

/**
 * Creates a source of a level and an order, without opinions.
 */
const sourceOf = (tier: StylingTier, order = 0): StylingSource => ({ owner: {}, tier, order, keys: null, string: null });

/**
 * The style of an element.
 */
const styleOf = (element: Element) => (element as HTMLElement).style;

/**
 * All the orders a list can be visited in.
 */
function permutations<Item>(items: readonly Item[]): Item[][] {
  if (items.length <= 1) {
    return [items.slice()];
  }

  return items.flatMap((item, index) => permutations(items.filter((_other, otherIndex) => otherIndex !== index)).map(rest => [item, ...rest]));
}

describe('styling state', () => {
  it('exists only once created, per attribute', () => {
    const element = document.createElement('div');
    expect(getStylingState(element, 'class')).toBeUndefined();
    expect(_hasStylingState(element, 'class')).toBe(false);

    const state = ensureStylingState(element, 'class');
    expect(ensureStylingState(element, 'class')).toBe(state);
    expect(_hasStylingState(element, 'class')).toBe(true);
    expect(_hasStylingState(element, 'style')).toBe(false);
  });

  it('resolves each class by the strongest source having an opinion: template, then directives from the last, then component, keys before strings', () => {
    const template = sourceOf(0);
    const first = sourceOf(1, 0);
    const second = sourceOf(1, 1);
    const component = sourceOf(2);
    const opinions = new Map<StylingSource, [Array<string | boolean> | null, Array<string | boolean> | null]>([
      [template, [['t-key', false], ['t-string', true, 'shared', true]]],
      [first, [['d-key', true, 'first-only', true], ['d-string', true, 'first-string', true]]],
      [second, [['d-key', false], ['d-string', false, 'second-string', true]]],
      [component, [['c-key', true, 't-key', true, 'd-string', true], ['c-string', true, 't-string', false, 'd-key', true, 'shared', false]]]
    ]);

    for (const order of permutations([template, first, second, component])) {
      const element = document.createElement('div');
      const state = createStylingState(element, 'class');
      for (let i = 0; i < order.length; i++) {
        const [keys, string] = opinions.get(order[i])!;
        setStylingSource(state, element, { ...order[i] }, keys, string);
      }

      expect([...element.classList].sort()).toEqual(['c-key', 'c-string', 'first-only', 'first-string', 'second-string', 'shared', 't-string']);
    }
  });

  it('resolves each property by the strongest source having an opinion, whatever the order of registration', () => {
    const template = sourceOf(0);
    const directive = sourceOf(1);
    const component = sourceOf(2);
    const opinions = new Map<StylingSource, [Array<string | boolean> | null, Array<string | boolean> | null]>([
      [template, [null, ['gap', '4px']]],
      [directive, [['width', '20px'], ['color', 'blue']]],
      [component, [['color', 'red'], ['display', 'flex', 'width', '10px', 'gap', '1px']]]
    ]);

    for (const order of permutations([template, directive, component])) {
      const element = document.createElement('div');
      const state = createStylingState(element, 'style');
      for (let i = 0; i < order.length; i++) {
        const [keys, string] = opinions.get(order[i])!;
        setStylingSource(state, element, { ...order[i] }, keys, string);
      }

      const style = styleOf(element);
      expect([style.getPropertyValue('display'), style.getPropertyValue('gap'), style.getPropertyValue('width'), style.getPropertyValue('color')]).toEqual(['flex', '4px', '20px', 'blue']);
    }
  });

  it('gives back the value of the source below when a source loses its opinion or is removed, and leaves the keys of the others', () => {
    const element = document.createElement('div');
    const state = createStylingState(element, 'style');
    const template = sourceOf(0);
    const component = sourceOf(2);
    setStylingSource(state, element, component, null, ['width', '10px', 'display', 'flex']);
    setStylingSource(state, element, template, ['width', '20px'], ['gap', '4px']);
    expect(styleOf(element).getPropertyValue('width')).toBe('20px');

    setStylingSource(state, element, template, null, ['gap', '4px']);
    expect(styleOf(element).getPropertyValue('width')).toBe('10px');

    setStylingSource(state, element, template, ['width', '30px'], null);
    removeStylingSource(state, element, component.owner);
    expect(styleOf(element).getPropertyValue('width')).toBe('30px');
    expect(styleOf(element).getPropertyValue('display')).toBe('');
    expect(styleOf(element).getPropertyValue('gap')).toBe('');

    removeStylingSource(state, element, template.owner);
    expect(styleOf(element).getPropertyValue('width')).toBe('');
    expect(state.sources).toBeNull();

    // A source never registered is not removed
    removeStylingSource(state, element, {});
    expect(state.sources).toBeNull();
  });

  it('removes a class a source makes absent, even if a source below makes it present', () => {
    const element = document.createElement('div');
    const state = createStylingState(element, 'class');
    setStylingSource(state, element, sourceOf(2), null, ['on', true]);
    expect(element.className).toBe('on');

    const template = sourceOf(0);
    setStylingSource(state, element, template, ['on', false], null);
    expect(element.className).toBe('');

    setStylingSource(state, element, template, null, null);
    expect(element.className).toBe('on');
  });

  it('leaves the keys other code wrote, removing only the ones the runtime wrote', () => {
    const element = document.createElement('div');
    element.classList.add('external');
    const state = createStylingState(element, 'class');
    const source = sourceOf(0);
    setStylingSource(state, element, source, ['external', false, 'mine', true], null);
    expect(element.className).toBe('mine');

    element.classList.add('external', 'other');
    setStylingSource(state, element, source, null, ['a', true, 'b', true]);
    expect(element.className).toBe('external other a b');

    setStylingSource(state, element, source, null, null);
    expect(element.className).toBe('external other');
  });

  it('writes a property with its priority, and only when the element does not hold it', () => {
    const element = document.createElement('div');
    const state = createStylingState(element, 'style');
    const source = sourceOf(0);
    setStylingSource(state, element, source, ['color', 'red !important'], null);
    expect(styleOf(element).getPropertyValue('color')).toBe('red');
    expect(styleOf(element).getPropertyPriority('color')).toBe('important');

    const before = element.getAttribute('style');
    setStylingSource(state, element, source, ['color', 'red !important'], ['color', 'blue']);
    expect(element.getAttribute('style')).toBe(before);

    setStylingSource(state, element, source, ['color', 'red'], null);
    expect(styleOf(element).getPropertyPriority('color')).toBe('');
  });

  it('keeps the sources from the strongest, a single one alone and more of them in an array', () => {
    const element = document.createElement('div');
    const state = createStylingState(element, 'class');
    const component = sourceOf(2);
    const directive = sourceOf(1, 3);
    const later = sourceOf(1, 5);
    const template = sourceOf(0);
    setStylingSource(state, element, component, null, null);
    expect(state.sources).toBe(component);

    setStylingSource(state, element, directive, null, null);
    setStylingSource(state, element, later, null, null);
    setStylingSource(state, element, template, null, null);
    expect(state.sources).toEqual([template, later, directive, component]);
    expect(findStylingSource(state, later.owner)).toBe(later);
    expect(findStylingSource(state, {})).toBeUndefined();

    removeStylingSource(state, element, template.owner);
    removeStylingSource(state, element, later.owner);
    removeStylingSource(state, element, directive.owner);
    expect(state.sources).toBe(component);
    expect(findStylingSource(state, component.owner)).toBe(component);
    expect(findStylingSource(state, {})).toBeUndefined();
  });

  it('keeps the keys it wrote alone, then in an array', () => {
    const element = document.createElement('div');
    const state = createStylingState(element, 'class');
    const source = sourceOf(0);
    setStylingSource(state, element, source, ['a', true], null);
    expect(state.written).toBe('a');

    setStylingSource(state, element, source, ['a', true, 'b', true, 'c', true], null);
    expect(state.written).toEqual(['a', 'b', 'c']);

    setStylingSource(state, element, source, ['b', true], null);
    expect(state.written).toBe('b');
  });
});

describe('host sources', () => {
  it('are registered per element and attribute, alone then in an array', () => {
    const element = document.createElement('div');
    const first = sourceOf(2);
    const second = sourceOf(1);
    const third = sourceOf(1, 1);
    expect(hasHostStylingSources(element, 'class')).toBe(false);

    addHostStylingSource(element, 'class', first);
    addHostStylingSource(element, 'class', second);
    addHostStylingSource(element, 'class', third);
    expect(hasHostStylingSources(element, 'class')).toBe(true);
    expect(hasHostStylingSources(element, 'style')).toBe(false);

    const state = createStylingState(element, 'class');
    expect(state.sources).toEqual([third, second, first]);

    removeHostStylingSource(element, 'class', second);
    removeHostStylingSource(element, 'class', first);
    removeHostStylingSource(element, 'class', third);
    expect(hasHostStylingSources(element, 'class')).toBe(false);

    addHostStylingSource(element, 'style', first);
    expect(hasHostStylingSources(element, 'style')).toBe(true);
    removeHostStylingSource(element, 'style', first);
    expect(hasHostStylingSources(element, 'style')).toBe(false);
  });

  it('give the state the keys the single one bound before wrote', () => {
    const element = document.createElement('div');
    const host: StylingSource = { owner: {}, tier: 2, order: 0, keys: ['on', true, 'off', false], string: ['a', true] };
    addHostStylingSource(element, 'class', host);
    applyDirectStyling(element, 'class', null, null, host.keys, host.string);
    const state = createStylingState(element, 'class');
    expect(state.written).toEqual(['a', 'on']);

    removeStylingSource(state, element, host.owner);
    expect(element.className).toBe('');
  });
});

describe('applyDirectStyling', () => {
  it('writes only the keys whose value changes, the keys bound one by one winning over the string', () => {
    const element = document.createElement('div');
    element.className = 'a external';
    applyDirectStyling(element, 'class', null, ['a', true], ['b', true], ['a', true, 'c', true]);
    expect(element.className).toBe('a external c b');

    applyDirectStyling(element, 'class', ['b', true], ['a', true, 'c', true], ['a', false], ['c', true, 'd', true]);
    expect(element.className).toBe('external c d');

    applyDirectStyling(element, 'class', ['a', false], ['c', true, 'd', true], null, null);
    expect(element.className).toBe('external');
  });

  it('sets, changes and removes the properties', () => {
    const element = document.createElement('div');
    applyDirectStyling(element, 'style', null, null, ['width', '10px'], ['color', 'red']);
    applyDirectStyling(element, 'style', ['width', '10px'], ['color', 'red'], null, ['color', 'blue']);
    expect(styleOf(element).getPropertyValue('width')).toBe('');
    expect(styleOf(element).getPropertyValue('color')).toBe('blue');
  });

  it('removes nothing the source had no opinion on, and nothing absent', () => {
    const element = document.createElement('div');
    element.className = 'x';
    styleOf(element).setProperty('top', '1px');
    applyDirectStyling(element, 'class', ['y', false], null, null, null);
    applyDirectStyling(element, 'style', null, null, null, null);
    applyDirectStyling(element, 'style', ['left', '1px'], null, null, null);
    expect(element.className).toBe('x');
    expect(styleOf(element).getPropertyValue('top')).toBe('1px');
  });
});

describe('writeStylingAttribute', () => {
  it('writes the whole attribute of the resolved opinions', () => {
    const element = document.createElement('div');
    writeStylingAttribute(element, 'class', ['b', true, 'a', false], ['a', true, 'c', true]);
    expect(element.getAttribute('class')).toBe('c b');

    writeStylingAttribute(element, 'style', ['width', '1px'], ['color', 'red !important', 'width', '2px']);
    expect(element.getAttribute('style')).toBe('color: red !important; width: 1px;');
  });

  it('writes nothing without opinions present', () => {
    const element = document.createElement('div');
    writeStylingAttribute(element, 'class', ['a', false], null);
    expect(element.hasAttribute('class')).toBe(false);
  });
});

describe('resolveOpinion', () => {
  it('finds a key at the even indices only, a value equal to a key being no key', () => {
    expect(resolveOpinion(['transition-property', 'color'], null, 'color')).toBeUndefined();
    expect(resolveOpinion(null, ['color', 'red'], 'color')).toBe('red');
    expect(resolveOpinion(['color', 'blue'], ['color', 'red'], 'color')).toBe('blue');
  });
});
