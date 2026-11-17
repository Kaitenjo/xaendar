import { describe, expect, it } from 'vitest';
import { entrySize, findEntry, insertEntry, removeEntry, tierOf, toRank } from './source-rank.util';

const TEMPLATE = toRank(0, 0);
const FIRST = toRank(1, 0);
const SECOND = toRank(1, 1);
const COMPONENT = toRank(2, 0);

describe('toRank', () => {
  it('keeps the level and the order in one integer', () => {
    expect([TEMPLATE, FIRST, SECOND, COMPONENT]).toEqual([0, 65536, 65537, 131072]);
    expect([tierOf(TEMPLATE), tierOf(SECOND), tierOf(COMPONENT)]).toEqual([0, 1, 2]);
  });

  it('gives a source of the template room for its data, a host run none', () => {
    expect(entrySize(TEMPLATE)).toBe(3);
    expect(entrySize(FIRST)).toBe(2);
  });
});

describe('insertEntry', () => {
  it('keeps the sources from the strongest, by level, then from the greatest order, in an array of the exact length', () => {
    const template = {};
    const first = {};
    const second = {};
    const component = {};
    let state = insertEntry(['name'], 1, component, COMPONENT, undefined);
    state = insertEntry(state, 1, first, FIRST, undefined);
    state = insertEntry(state, 1, template, TEMPLATE, 'value');
    state = insertEntry(state, 1, second, SECOND, undefined);
    expect(state).toEqual(['name', template, TEMPLATE, 'value', second, SECOND, first, FIRST, component, COMPONENT]);
    expect(findEntry(state, 1, first)).toBe(6);
    expect(findEntry(state, 1, {})).toBe(-1);
  });

  it('puts a source after the ones of the same rank', () => {
    const own = {};
    const branch = {};
    const state = insertEntry(insertEntry([], 0, own, TEMPLATE, 1), 0, branch, TEMPLATE, 2);
    expect(state).toEqual([own, TEMPLATE, 1, branch, TEMPLATE, 2]);
  });
});

describe('removeEntry', () => {
  it('gives the state without the source, in an array of the exact length', () => {
    const template = {};
    const run = {};
    const state = [template, TEMPLATE, 'value', run, FIRST];
    expect(removeEntry(state, 0)).toEqual([run, FIRST]);
    expect(removeEntry(state, 3)).toEqual([template, TEMPLATE, 'value']);
  });
});
