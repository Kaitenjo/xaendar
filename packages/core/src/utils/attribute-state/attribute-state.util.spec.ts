// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { HostAttributeRun } from '../../models/host-attribute-run/host-attribute-run';
import type { SourceRank } from '../../types/source-rank.type';
import { _hasAttributeState, _mergeAttributes, addHostAttributeSource, createAttributeState, ensureAttributeState, findAttributeState, getAttributeState, hasHostAttributeSource, indexOfAttribute, mergesAllAttributes, removeAttributeOpinion, removeHostAttributeSource, setAttributeOpinion } from './attribute-state.util';

const TEMPLATE: SourceRank = { tier: 0, order: 0 };
const FIRST: SourceRank = { tier: 1, order: 0 };
const SECOND: SourceRank = { tier: 1, order: 1 };
const COMPONENT: SourceRank = { tier: 2, order: 0 };

/**
 * Creates a run writing some attributes, at a rank, with the values computed last.
 */
function runOf(element: Element, rank: SourceRank, values: Record<string, unknown>): HostAttributeRun {
  const names = Object.keys(values);
  const run = new HostAttributeRun({} as never, element, names.map(name => ({ name, kind: 'attribute' as const, read: () => values[name] })), rank.tier, rank.order);
  for (let i = 0; i < names.length; i++) {
    run.values[i] = values[names[i]];
  }

  return run;
}

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
  it('exists only once created, per attribute, the states of an element kept under one entry', () => {
    // The browser merges no element by itself
    expect(mergesAllAttributes()).toBe(false);
    const element = document.createElement('div');
    expect(getAttributeState(element, 'id')).toBeUndefined();
    expect(_hasAttributeState(element, 'id')).toBe(false);

    const id = ensureAttributeState(element, 'id');
    expect(ensureAttributeState(element, 'id')).toBe(id);
    expect(getAttributeState(element, 'title')).toBeUndefined();

    const title = createAttributeState(element, 'title');
    const role = createAttributeState(element, 'role');
    expect([getAttributeState(element, 'id'), getAttributeState(element, 'title'), getAttributeState(element, 'role')]).toEqual([id, title, role]);
    expect(getAttributeState(element, 'lang')).toBeUndefined();
    expect(_hasAttributeState(element, 'role')).toBe(true);
  });

  it('writes the value of the strongest source with an opinion, whatever the order the sources write in', () => {
    const owners = { template: {}, first: {}, second: {}, component: {} };
    const ranks = new Map<object, SourceRank>([[owners.template, TEMPLATE], [owners.first, FIRST], [owners.second, SECOND], [owners.component, COMPONENT]]);
    const values = new Map<object, unknown>([[owners.template, null], [owners.first, 'first'], [owners.second, 'second'], [owners.component, 'component']]);
    for (const order of permutations(Object.values(owners))) {
      const element = document.createElement('div');
      const state = createAttributeState(element, 'title');
      for (let i = 0; i < order.length; i++) {
        setAttributeOpinion(state, element, order[i], ranks.get(order[i])!, values.get(order[i]));
      }

      expect(element.getAttribute('title')).toBe('second');
      removeAttributeOpinion(state, element, owners.second);
      expect(element.getAttribute('title')).toBe('first');
      setAttributeOpinion(state, element, owners.template, TEMPLATE, 'template');
      expect(element.getAttribute('title')).toBe('template');
      removeAttributeOpinion(state, element, owners.template);
      removeAttributeOpinion(state, element, owners.first);
      expect(element.getAttribute('title')).toBe('component');
      removeAttributeOpinion(state, element, owners.component);
      expect(element.hasAttribute('title')).toBe(false);
    }
  });

  it('removes the attribute for false, as an expressed value, but writes "false" on aria-* and enumerated attributes', () => {
    const element = document.createElement('div');
    const template = {};
    const component = {};
    for (const name of ['hidden', 'aria-expanded', 'draggable']) {
      const state = createAttributeState(element, name);
      setAttributeOpinion(state, element, component, COMPONENT, true);
      setAttributeOpinion(state, element, template, TEMPLATE, false);
    }

    expect(element.hasAttribute('hidden')).toBe(false);
    expect(element.getAttribute('aria-expanded')).toBe('false');
    expect(element.getAttribute('draggable')).toBe('false');
  });

  it('removes the attribute no source has an opinion on only when the runtime wrote it', () => {
    const element = document.createElement('div');
    element.setAttribute('title', 'external');
    const state = createAttributeState(element, 'title');
    const owner = {};
    setAttributeOpinion(state, element, owner, TEMPLATE, null);
    expect(element.getAttribute('title')).toBe('external');

    setAttributeOpinion(state, element, owner, TEMPLATE, 'mine');
    setAttributeOpinion(state, element, owner, TEMPLATE, undefined);
    expect(element.hasAttribute('title')).toBe(false);

    // Removed by other code meanwhile: nothing to remove
    setAttributeOpinion(state, element, owner, TEMPLATE, 'again');
    element.removeAttribute('title');
    removeAttributeOpinion(state, element, owner);
    expect(element.hasAttribute('title')).toBe(false);

    // A source never registered changes nothing
    removeAttributeOpinion(state, element, {});

    // Several sources without opinion leave the attribute alone
    setAttributeOpinion(state, element, {}, COMPONENT, null);
    setAttributeOpinion(state, element, {}, FIRST, undefined);
    element.setAttribute('title', 'external');
    setAttributeOpinion(state, element, owner, TEMPLATE, null);
    expect(element.getAttribute('title')).toBe('external');
  });

  it('writes nothing when the element holds the value already, as an element adopted from the server', () => {
    const element = document.createElement('div');
    element.setAttribute('id', 'a');
    const observer = new MutationObserver(() => undefined);
    observer.observe(element, { attributes: true });
    const state = createAttributeState(element, 'id');
    setAttributeOpinion(state, element, {}, TEMPLATE, 'a');
    expect(observer.takeRecords()).toEqual([]);
    expect(state.written).toBe(true);
  });

  it('holds the opinions of the runs of host attributes registered before it is created', () => {
    const element = document.createElement('div');
    const component = runOf(element, COMPONENT, { id: 'c', role: null });
    const directive = runOf(element, FIRST, { title: 't' });
    addHostAttributeSource(component);
    addHostAttributeSource(directive);
    expect(hasHostAttributeSource(element, 'id')).toBe(true);
    expect(hasHostAttributeSource(element, 'title')).toBe(true);
    expect(hasHostAttributeSource(element, 'lang')).toBe(false);

    const id = createAttributeState(element, 'id');
    expect(id.written).toBe(true);
    expect(id.opinions).toEqual({ owner: component, tier: 2, order: 0, value: 'c' });

    // A run without opinion on the attribute registers once it has one
    const role = createAttributeState(element, 'role');
    expect(role.opinions).toBeNull();
    expect(role.written).toBe(false);

    removeHostAttributeSource(component);
    expect(hasHostAttributeSource(element, 'id')).toBe(false);
    removeHostAttributeSource(directive);
    expect(hasHostAttributeSource(element, 'title')).toBe(false);

    const single = runOf(element, COMPONENT, { lang: false });
    addHostAttributeSource(single);
    const lang = createAttributeState(element, 'lang');
    expect(lang.written).toBe(false);
    expect(indexOfAttribute(single, 'lang')).toBe(0);
    expect(indexOfAttribute(single, 'dir')).toBe(-1);
    removeHostAttributeSource(single);
    expect(hasHostAttributeSource(element, 'lang')).toBe(false);
  });

  it('keeps the third run registered in the array of the element', () => {
    const element = document.createElement('div');
    const runs = [runOf(element, FIRST, { id: 'a' }), runOf(element, SECOND, { id: 'b' }), runOf(element, COMPONENT, { role: 'c' })];
    for (let i = 0; i < runs.length; i++) {
      addHostAttributeSource(runs[i]);
    }

    removeHostAttributeSource(runs[0]);
    expect(hasHostAttributeSource(element, 'id')).toBe(true);
    expect(hasHostAttributeSource(element, 'role')).toBe(true);
  });

  it('creates the state of any attribute an element merging all of them writes', () => {
    const plain = document.createElement('div');
    expect(findAttributeState(plain, 'id')).toBeUndefined();

    const merged = document.createElement('div');
    _mergeAttributes(merged);
    _mergeAttributes(document.createElement('span'));
    expect(mergesAllAttributes()).toBe(true);
    const state = findAttributeState(merged, 'id');
    expect(state).toBeDefined();
    expect(findAttributeState(merged, 'id')).toBe(state);
    expect(findAttributeState(plain, 'id')).toBeUndefined();
  });
});
