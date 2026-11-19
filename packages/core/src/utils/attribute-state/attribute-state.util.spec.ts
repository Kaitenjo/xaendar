// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { HostAttributeRun } from '../../models/host-attribute-run/host-attribute-run';
import { HostStylingRun } from '../../models/host-styling-run/host-styling-run';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import { addHostRun, getElementSources } from '../element-sources/element-sources.util';
import { toRank } from '../source-rank/source-rank.util';
import { _hasAttributeState, _mergeAttributes, createAttributeState, ensureAttributeState, getAttributeState, hostWritesAttribute, indexOfAttribute, isAttributeWritten, keepTemplateValue, mergesAllAttributes, removeAttributeOpinion, setAttributeOpinion } from './attribute-state.util';

const FIRST = toRank(1, 0);
const SECOND = toRank(1, 1);
const COMPONENT = toRank(2, 0);

/**
 * Describes an attribute of the template.
 */
const attributeOf = (name: string): RenderElementAttribute => ({ name, value: '', setter: () => undefined, shared: true });

/**
 * Creates a run writing some attributes, at a rank, with the values computed last.
 */
function runOf(element: Element, rank: number, values: Record<string, unknown>): HostAttributeRun {
  const names = Object.keys(values);
  const run = new HostAttributeRun({} as never, element, names.map(name => ({ name, kind: 'attribute' as const, read: () => values[name] })), rank);
  run.values = names.length === 1 ? values[names[0]] : names.map(name => values[name]);
  return run;
}

/**
 * Gives a source a value, through the state of the attribute: a run holds its value, the template gives it.
 */
function opine(element: Element, name: string, owner: RenderElementAttribute | HostAttributeRun, value: unknown): void {
  const state = getAttributeState(element, name)!;
  if (owner instanceof HostAttributeRun) {
    const previous = owner.values;
    owner.values = value;
    setAttributeOpinion(element, state, owner, owner.rank, undefined, previous);
  } else {
    setAttributeOpinion(element, state, owner, 0, value);
  }
}

/**
 * Removes a source from the state of an attribute.
 */
const remove = (element: Element, name: string, owner: object) => removeAttributeOpinion(element, getAttributeState(element, name)!, owner);

/**
 * All the orders a list can be visited in.
 */
function permutations<Item>(items: readonly Item[]): Item[][] {
  if (items.length <= 1) {
    return [items.slice()];
  }

  return items.flatMap((item, index) => permutations(items.filter((_other, otherIndex) => otherIndex !== index)).map(rest => [item, ...rest]));
}

describe('attribute state', () => {
  it('exists only once created, per attribute, the states of an element kept together', () => {
    // The browser merges no element by itself
    expect(mergesAllAttributes()).toBe(false);
    const element = document.createElement('div');
    expect(getAttributeState(element, 'id')).toBeUndefined();
    expect(_hasAttributeState(element, 'id')).toBe(false);

    const id = ensureAttributeState(element, 'id');
    expect(id).toEqual(['id']);
    expect(ensureAttributeState(element, 'id')).toBe(id);
    expect(getAttributeState(element, 'title')).toBeUndefined();

    const title = createAttributeState(element, 'title');
    const role = createAttributeState(element, 'role');
    expect(getElementSources(element)!.attributes).toEqual([id, title, role]);
    expect([getAttributeState(element, 'id'), getAttributeState(element, 'title'), getAttributeState(element, 'role')]).toEqual([id, title, role]);
    expect(getAttributeState(element, 'lang')).toBeUndefined();
    expect(_hasAttributeState(element, 'role')).toBe(true);
  });

  it('writes the value of the strongest source with an opinion, whatever the order the sources write in', () => {
    const template = attributeOf('title');
    for (let attempt = 0; attempt < 24; attempt++) {
      const element = document.createElement('div');
      const first = runOf(element, FIRST, { title: undefined });
      const second = runOf(element, SECOND, { title: undefined });
      const component = runOf(element, COMPONENT, { title: undefined });
      const values = new Map<RenderElementAttribute | HostAttributeRun, unknown>([[template, null], [first, 'first'], [second, 'second'], [component, 'component']]);
      createAttributeState(element, 'title');
      const order = permutations([...values.keys()])[attempt];
      for (let i = 0; i < order.length; i++) {
        opine(element, 'title', order[i], values.get(order[i]));
      }

      expect(element.getAttribute('title')).toBe('second');
      remove(element, 'title', second);
      expect(element.getAttribute('title')).toBe('first');
      opine(element, 'title', template, 'template');
      expect(element.getAttribute('title')).toBe('template');
      remove(element, 'title', template);
      opine(element, 'title', first, null);
      expect(element.getAttribute('title')).toBe('component');
      remove(element, 'title', first);
      remove(element, 'title', component);
      expect(element.hasAttribute('title')).toBe(false);
      expect(getAttributeState(element, 'title')).toEqual(['title']);
    }
  });

  it('removes the attribute for false, as an expressed value, but writes "false" on aria-* and enumerated attributes', () => {
    const element = document.createElement('div');
    for (const name of ['hidden', 'aria-expanded', 'draggable']) {
      createAttributeState(element, name);
      opine(element, name, runOf(element, COMPONENT, { [name]: undefined }), true);
      opine(element, name, attributeOf(name), false);
    }

    expect(element.hasAttribute('hidden')).toBe(false);
    expect(element.getAttribute('aria-expanded')).toBe('false');
    expect(element.getAttribute('draggable')).toBe('false');
  });

  it('removes the attribute no source has an opinion on only when the sources gave it a text', () => {
    const element = document.createElement('div');
    element.setAttribute('title', 'external');
    createAttributeState(element, 'title');
    const owner = attributeOf('title');
    opine(element, 'title', owner, null);
    expect(element.getAttribute('title')).toBe('external');

    opine(element, 'title', owner, 'mine');
    opine(element, 'title', owner, undefined);
    expect(element.hasAttribute('title')).toBe(false);

    // A value without text removes nothing other code writes after it
    opine(element, 'title', owner, false);
    element.setAttribute('title', 'external');
    opine(element, 'title', owner, null);
    expect(element.getAttribute('title')).toBe('external');

    // Removed by other code meanwhile: nothing to remove
    opine(element, 'title', owner, 'again');
    element.removeAttribute('title');
    remove(element, 'title', owner);
    expect(element.hasAttribute('title')).toBe(false);

    // A source never registered changes nothing
    remove(element, 'title', {});

    // Several sources without opinion leave the attribute alone
    opine(element, 'title', runOf(element, COMPONENT, { title: undefined }), null);
    opine(element, 'title', runOf(element, FIRST, { title: undefined }), undefined);
    element.setAttribute('title', 'external');
    opine(element, 'title', owner, null);
    expect(element.getAttribute('title')).toBe('external');
  });

  it('writes nothing when the element holds the value already, as an element adopted from the server', () => {
    const element = document.createElement('div');
    element.setAttribute('id', 'a');
    const observer = new MutationObserver(() => undefined);
    observer.observe(element, { attributes: true });
    createAttributeState(element, 'id');
    opine(element, 'id', attributeOf('id'), 'a');
    expect(observer.takeRecords()).toEqual([]);
  });

  it('holds the runs of host attributes registered before it is created, reading their values', () => {
    const element = document.createElement('div');
    const component = runOf(element, COMPONENT, { id: 'c', role: null });
    const directive = runOf(element, FIRST, { title: 't' });
    addHostRun(component);
    addHostRun(new HostStylingRun({} as never, element, 'class', [{ name: 'id', kind: 'class', read: () => true }], FIRST));
    addHostRun(directive);
    expect([hostWritesAttribute(element, 'id'), hostWritesAttribute(element, 'title'), hostWritesAttribute(element, 'lang')]).toEqual([true, true, false]);

    const id = createAttributeState(element, 'id');
    expect(id).toEqual(['id', component, COMPONENT]);

    // The value the run wrote is removed with it
    element.setAttribute('id', 'c');
    remove(element, 'id', component);
    expect(element.hasAttribute('id')).toBe(false);

    const single = document.createElement('div');
    const run = runOf(single, COMPONENT, { lang: 'it' });
    addHostRun(run);
    expect(createAttributeState(single, 'lang')).toEqual(['lang', run, COMPONENT]);
    expect(indexOfAttribute(run, 'lang')).toBe(0);
    expect(indexOfAttribute(run, 'dir')).toBe(-1);
    expect(isAttributeWritten(single, 'dir')).toBe(false);
  });
});

describe('an element merging all its attributes', () => {
  it('keeps the values of the template, which the state created later takes', () => {
    const element = document.createElement('div');
    _mergeAttributes(element);
    _mergeAttributes(element);
    expect(mergesAllAttributes()).toBe(true);
    const record = getElementSources(element)!;
    expect(record.template).toEqual([]);

    const id = attributeOf('id');
    const branch = attributeOf('id');
    keepTemplateValue(record, id, 'a');
    const role = attributeOf('role');
    keepTemplateValue(record, role, 'note');
    keepTemplateValue(record, id, 'b');
    keepTemplateValue(record, branch, null);
    expect(record.template).toEqual([id, 'b', role, 'note', branch, null]);
    expect(isAttributeWritten(element, 'id')).toBe(true);
    expect(isAttributeWritten(element, 'lang')).toBe(false);
    expect(createAttributeState(element, 'id')).toEqual(['id', id, 0, 'b', branch, 0, null]);
  });
});
