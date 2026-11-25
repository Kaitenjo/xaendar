// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import type { _RenderStyling } from '../../types/styling/render-styling.type';
import type { StylingAttribute } from '../../types/styling/styling-attribute.type';
import type { TemplateStyling } from '../../types/styling/template-styling.type';
import { addHostRun, ensureElementSources, getElementSources } from '../element-sources/element-sources.util';
import { toRank } from '../source-rank/source-rank.util';
import { _hasStylingState, applyDirectStyling, createStylingState, ensureStylingState, getStylingState, keepTemplateStyling, keptValues, markStyling, removeStylingSource, resolveOpinion, setHostStyling, setTemplateStyling, sharesNewKey, writeStylingAttribute } from './styling-state.util';

/**
 * Describes a binding of the template with a string and keys bound one by one, its values being the string, then the
 * values of the keys.
 */
const templateOf = (name: StylingAttribute, keys: string[] = []): _RenderStyling => ({ name, string: () => null, keys, values: keys.map(() => () => null), setter: () => undefined });

/**
 * Creates a run of host attributes with a string and keys bound one by one, at a level and an order.
 */
function hostOf(element: Element, attribute: StylingAttribute, tier: 1 | 2, order: number, keys: string[] = []): HostStylingRun {
  const read = () => undefined;
  return new HostStylingRun({} as never, element, attribute, [{ name: '', kind: attribute, read }, ...keys.map(name => ({ name, kind: attribute, read }))], toRank(tier, order));
}

/**
 * Gives a source the values of its string and of its keys, writing them through the state of the element.
 */
function set(element: Element, source: _RenderStyling | HostStylingRun, string: string | null, ...keys: unknown[]): void {
  const record = getElementSources(element)!;
  if (source instanceof HostStylingRun) {
    const previous = source.values;
    source.values = [string, ...keys];
    setHostStyling(element, record, source, previous);
  } else {
    setTemplateStyling(element, record, source, [string, ...keys]);
  }
}

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
    expect(state).toEqual([]);
    expect(ensureStylingState(element, 'class')).toBe(state);
    expect(createStylingState(element, 'class')).toBe(state);
    expect(_hasStylingState(element, 'class')).toBe(true);
    expect(_hasStylingState(element, 'style')).toBe(false);
  });

  it('resolves each class by the strongest source having an opinion: template, then directives from the last, then component, keys before strings', () => {
    const template = templateOf('class', ['t-key']);
    for (let attempt = 0; attempt < 24; attempt++) {
      const element = document.createElement('div');
      const first = hostOf(element, 'class', 1, 0, ['d-key', 'first-only']);
      const second = hostOf(element, 'class', 1, 1, ['d-key']);
      const component = hostOf(element, 'class', 2, 0, ['c-key', 't-key']);
      const writes = new Map<unknown, () => void>([
        [template, () => set(element, template, 't-string shared', false)],
        [first, () => set(element, first, 'd-string first-string', true, true)],
        [second, () => set(element, second, 'second-string', false)],
        [component, () => set(element, component, 'c-string d-key', true, true)]
      ]);
      createStylingState(element, 'class');
      const order = permutations([...writes.keys()])[attempt];
      for (let i = 0; i < order.length; i++) {
        writes.get(order[i])!();
      }

      expect([...element.classList].sort()).toEqual(['c-key', 'c-string', 'd-string', 'first-only', 'first-string', 'second-string', 'shared', 't-string']);
    }
  });

  it('resolves each property by the strongest source having an opinion, whatever the order of registration', () => {
    const template = templateOf('style');
    for (let attempt = 0; attempt < 6; attempt++) {
      const element = document.createElement('div');
      const directive = hostOf(element, 'style', 1, 0, ['width']);
      const component = hostOf(element, 'style', 2, 0, ['color']);
      const writes = new Map<unknown, () => void>([
        [template, () => set(element, template, 'gap: 4px')],
        [directive, () => set(element, directive, 'color: blue', '20px')],
        [component, () => set(element, component, 'display: flex; width: 10px; gap: 1px', 'red')]
      ]);
      createStylingState(element, 'style');
      const order = permutations([...writes.keys()])[attempt];
      for (let i = 0; i < order.length; i++) {
        writes.get(order[i])!();
      }

      const style = styleOf(element);
      expect([style.getPropertyValue('display'), style.getPropertyValue('gap'), style.getPropertyValue('width'), style.getPropertyValue('color')]).toEqual(['flex', '4px', '20px', 'blue']);
    }
  });

  it('gives back the value of the source below when a source loses its opinion or is removed, and leaves the keys of the others', () => {
    const element = document.createElement('div');
    const template = templateOf('style', ['width']);
    const component = hostOf(element, 'style', 2, 0);
    createStylingState(element, 'style');
    set(element, component, 'width: 10px; display: flex');
    set(element, template, 'gap: 4px', '20px');
    expect(styleOf(element).getPropertyValue('width')).toBe('20px');

    set(element, template, 'gap: 4px', null);
    expect(styleOf(element).getPropertyValue('width')).toBe('10px');

    set(element, template, null, '30px');
    removeStylingSource(element, 'style', component);
    expect(styleOf(element).getPropertyValue('width')).toBe('30px');
    expect(styleOf(element).getPropertyValue('display')).toBe('');
    expect(styleOf(element).getPropertyValue('gap')).toBe('');

    removeStylingSource(element, 'style', template);
    expect(styleOf(element).getPropertyValue('width')).toBe('');
    expect(getStylingState(element, 'style')).toEqual([]);

    // A source never registered is not removed
    removeStylingSource(element, 'style', {});
    expect(getStylingState(element, 'style')).toEqual([]);
  });

  it('removes a class a source makes absent, even if a source below makes it present', () => {
    const element = document.createElement('div');
    createStylingState(element, 'class');
    set(element, hostOf(element, 'class', 2, 0), 'on');
    expect(element.className).toBe('on');

    const template = templateOf('class', ['on']);
    set(element, template, null, false);
    expect(element.className).toBe('');

    set(element, template, null, null);
    expect(element.className).toBe('on');
  });

  it('leaves the keys other code wrote, removing only the ones the sources made present', () => {
    const element = document.createElement('div');
    element.classList.add('external');
    createStylingState(element, 'class');
    const template = templateOf('class', ['external', 'mine']);
    set(element, template, null, false, true);
    expect(element.className).toBe('mine');

    element.classList.add('external', 'other');
    set(element, template, 'a b', null, null);
    expect(element.className).toBe('external other a b');

    set(element, template, null, null, null);
    expect(element.className).toBe('external other');
  });

  it('writes a property with its priority, and only when the element does not hold it', () => {
    const element = document.createElement('div');
    createStylingState(element, 'style');
    const template = templateOf('style', ['color']);
    set(element, template, null, 'red !important');
    expect(styleOf(element).getPropertyValue('color')).toBe('red');
    expect(styleOf(element).getPropertyPriority('color')).toBe('important');

    const before = element.getAttribute('style');
    set(element, template, 'color: blue', 'red !important');
    expect(element.getAttribute('style')).toBe(before);

    set(element, template, null, 'red');
    expect(styleOf(element).getPropertyPriority('color')).toBe('');
  });

  it('keeps the sources from the strongest in one array of the exact length, the values of the template only', () => {
    const element = document.createElement('div');
    const template = templateOf('class');
    const component = hostOf(element, 'class', 2, 0);
    const directive = hostOf(element, 'class', 1, 3);
    const later = hostOf(element, 'class', 1, 5);
    createStylingState(element, 'class');
    set(element, component, null);
    set(element, directive, null);
    set(element, later, null);
    set(element, template, 'a');
    expect(getStylingState(element, 'class')).toEqual([template, 0, ['a'], later, later.rank, directive, directive.rank, component, component.rank]);

    removeStylingSource(element, 'class', template);
    removeStylingSource(element, 'class', later);
    expect(getStylingState(element, 'class')).toEqual([directive, directive.rank, component, component.rank]);
  });
});

describe('the binding of the template kept by the element', () => {
  it('is kept alone without values, with them otherwise, once the attribute is marked', () => {
    const element = document.createElement('div');
    markStyling(element, 'class');
    markStyling(element, 'class');
    const record = getElementSources(element)!;
    expect(record.class).toBe(true);

    const statics = { name: 'class', statics: ['a', true], setter: () => undefined } as _RenderStyling;
    keepTemplateStyling(record, statics, undefined);
    expect(record.class).toBe(statics);
    expect(keptValues(statics)).toBeUndefined();

    const styling = templateOf('style');
    markStyling(element, 'style');
    keepTemplateStyling(record, styling, ['top: 1px']);
    expect(record.style).toEqual({ site: styling, values: ['top: 1px'] });
    const kept = record.style as TemplateStyling;
    keepTemplateStyling(record, styling, ['top: 2px']);
    expect(record.style).toBe(kept);
    expect(keptValues(kept)).toEqual(['top: 2px']);
  });

  it('is taken by the state, with the host runs of the attribute, ranked', () => {
    const element = document.createElement('div');
    const record = ensureElementSources(element);
    const styling = templateOf('class');
    const component = hostOf(element, 'class', 2, 0);
    const directive = hostOf(element, 'class', 1, 0);
    const other = hostOf(element, 'style', 1, 0);
    addHostRun(component);
    addHostRun(other);
    addHostRun(directive);
    record.class = true;
    keepTemplateStyling(record, styling, ['a']);
    expect(createStylingState(element, 'class')).toEqual([styling, 0, ['a'], directive, directive.rank, component, component.rank]);

    // A single run of the attribute, and a static binding
    const single = document.createElement('div');
    const singleRecord = ensureElementSources(single);
    const statics = { name: 'style', statics: ['top', '1px'], setter: () => undefined } as _RenderStyling;
    singleRecord.style = true;
    keepTemplateStyling(singleRecord, statics, undefined);
    const run = hostOf(single, 'style', 2, 0);
    addHostRun(run);
    expect(createStylingState(single, 'style')).toEqual([statics, 0, undefined, run, run.rank]);
    expect(createStylingState(single, 'class')).toEqual([]);
  });
});

describe('sharesNewKey', () => {
  it('tells a key another source has an opinion on, which the source had none on', () => {
    const element = document.createElement('div');
    const record = ensureElementSources(element);
    const styling = templateOf('class', ['on']);
    const run = hostOf(element, 'class', 1, 0, ['off']);
    run.values = [null, false];
    addHostRun(run);
    addHostRun(hostOf(element, 'style', 1, 0));
    record.class = true;
    keepTemplateStyling(record, styling, ['a', true]);

    // The template meets the run, the run meets the template
    expect(sharesNewKey(record, 'class', styling, null, null, ['off', true], null)).toBe(true);
    expect(sharesNewKey(record, 'class', styling, null, ['a', true], null, ['a', true, 'b', true])).toBe(false);
    expect(sharesNewKey(record, 'class', run, null, null, null, ['on', true])).toBe(true);
    expect(sharesNewKey(record, 'class', run, null, null, null, ['a', true])).toBe(true);
    expect(sharesNewKey(record, 'class', run, ['off', false], null, ['off', true], null)).toBe(false);
    expect(sharesNewKey(record, 'class', run, null, null, null, ['z', true])).toBe(false);

    // A single run, or none
    const single = document.createElement('div');
    const singleRecord = ensureElementSources(single);
    expect(sharesNewKey(singleRecord, 'style', run, null, null, null, ['top', '1px'])).toBe(false);
    const host = hostOf(single, 'style', 2, 0);
    host.values = ['top: 1px'];
    addHostRun(host);
    expect(sharesNewKey(singleRecord, 'style', styling, null, null, null, ['top', '2px'])).toBe(true);
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

  it('sets alone a value holding a semicolon, which adds no declaration to the attribute', () => {
    const element = document.createElement('div');
    writeStylingAttribute(element, 'style', ['color', 'red; position: fixed', 'background-image', 'url("a;b")', 'width', '1px'], null);

    expect(element.style.getPropertyValue('position')).toBe('');
    expect(element.style.getPropertyValue('width')).toBe('1px');
    expect(element.style.getPropertyValue('background-image')).toBe('url("a;b")');
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
