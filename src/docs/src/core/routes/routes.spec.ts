import { describe, expect, it } from 'vitest';
import { findNeighbours, findPage, HOME_PAGE, NAV, PAGES, searchPages } from './routes';

describe('routes', () => {
  it('has unique paths', () => {
    const paths = PAGES.map(page => page.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('titles every page and entry in every language', () => {
    for (const page of PAGES) {
      expect(page.title.en.trim()).not.toBe('');
      expect(page.title.it.trim()).not.toBe('');
    }
    for (const section of NAV) {
      expect(section.title.en.trim()).not.toBe('');
      expect(section.title.it.trim()).not.toBe('');
      for (const item of section.items) {
        expect(item.page ?? item.pages).toBeDefined();
      }
    }
  });

  it('lists the pages in navigation order', () => {
    expect(PAGES[0]?.path).toBe('overview');
    expect(PAGES.at(-1)?.path).toBe('reference/coming-from-angular');
  });
});

describe('findPage', () => {
  it('finds a page by path', () => {
    expect(findPage('signals/computed')?.title.en).toBe('Computed signals');
  });

  it('finds the home page', () => {
    expect(findPage('')).toBe(HOME_PAGE);
  });

  it('returns undefined for unknown paths', () => {
    expect(findPage('nope')).toBeUndefined();
  });
});

describe('findNeighbours', () => {
  it('links the home page to the first page', () => {
    expect(findNeighbours('')).toEqual({ previous: undefined, next: PAGES[0] });
  });

  it('links the first page back to the home page', () => {
    expect(findNeighbours('overview').previous).toBe(HOME_PAGE);
  });

  it('finds the surrounding pages', () => {
    const index = PAGES.findIndex(page => page.path === 'signals/computed');
    expect(findNeighbours('signals/computed')).toEqual({ previous: PAGES[index - 1], next: PAGES[index + 1] });
  });

  it('has no next page after the last one', () => {
    expect(findNeighbours(PAGES.at(-1)!.path).next).toBeUndefined();
  });

  it('has no neighbours for unknown pages', () => {
    expect(findNeighbours('nope')).toEqual({ previous: undefined, next: undefined });
  });
});

describe('searchPages', () => {
  it('returns nothing for a blank query', () => {
    expect(searchPages('   ', 'en')).toEqual([]);
  });

  it('matches titles in any language', () => {
    expect(searchPages('derivati', 'en').map(page => page.path)).toContain('signals/computed');
    expect(searchPages('computed signals', 'it').map(page => page.path)).toContain('signals/computed');
  });

  it('matches keywords and paths', () => {
    expect(searchPages('microtask', 'en').map(page => page.path)).toEqual(['signals/effects']);
    expect(searchPages('templates/for', 'en').map(page => page.path)).toEqual(['templates/for']);
  });

  it('requires every word to match', () => {
    expect(searchPages('computed zzz', 'en')).toEqual([]);
  });

  it('ranks title matches in the current language first', () => {
    expect(searchPages('effect', 'en')[0]?.path).toBe('signals/effects');
  });

  it('limits the results', () => {
    expect(searchPages('e', 'en', 3)).toHaveLength(3);
  });
});
