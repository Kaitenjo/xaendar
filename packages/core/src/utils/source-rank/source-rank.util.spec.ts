import { describe, expect, it } from 'vitest';
import type { SourceRank } from '../../types/source-rank.type';
import { insertRanked, removeRanked } from './source-rank.util';

describe('insertRanked', () => {
  it('keeps one source as it is, then an array from the strongest: by level, then from the greatest order', () => {
    const component: SourceRank = { tier: 2, order: 0 };
    const first: SourceRank = { tier: 1, order: 0 };
    const second: SourceRank = { tier: 1, order: 1 };
    const template: SourceRank = { tier: 0, order: 0 };

    let sources = insertRanked(null, component);
    expect(sources).toBe(component);

    sources = insertRanked(sources, first);
    expect(sources).toEqual([first, component]);

    sources = insertRanked(sources, template);
    sources = insertRanked(sources, second);
    expect(sources).toEqual([template, second, first, component]);
  });

  it('puts a source after the ones of the same rank, and before a weaker one met second', () => {
    const strong: SourceRank = { tier: 0, order: 0 };
    const weak: SourceRank = { tier: 2, order: 0 };
    expect(insertRanked(weak, strong)).toEqual([strong, weak]);

    const same: SourceRank = { tier: 0, order: 0 };
    expect(insertRanked([strong, weak], same)).toEqual([strong, same, weak]);
  });
});

describe('removeRanked', () => {
  it('leaves nothing for a single source, the other one alone for two, an array for more', () => {
    const first: SourceRank = { tier: 0, order: 0 };
    const second: SourceRank = { tier: 1, order: 0 };
    const third: SourceRank = { tier: 2, order: 0 };
    expect(removeRanked(first, first)).toBeNull();
    expect(removeRanked([first, second], first)).toBe(second);
    expect(removeRanked([first, second, third], second)).toEqual([first, third]);
  });
});
