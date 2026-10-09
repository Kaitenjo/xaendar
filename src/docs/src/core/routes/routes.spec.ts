import { describe, expect, it } from 'vitest';
import en from '../../i18n/en.json';
import it_ from '../../i18n/it.json';
import { findNeighbours, findPage, HOME_PAGE, itemTitle, NAV, PAGES, pageTitle, searchPages } from './routes';

describe('routes', () => {
  it('has unique paths', () => {
    const paths = PAGES.map(page => page.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('titles every page and entry in every language', () => {
    for (const messages of [en, it_]) {
      expect(pageTitle(HOME_PAGE, messages).trim()).not.toBe('');
      for (const page of PAGES) {
        expect(pageTitle(page, messages).trim()).not.toBe('');
      }
      for (const section of NAV) {
        expect(messages.nav.sections[section.key].trim()).not.toBe('');
        for (const item of section.items) {
          expect(itemTitle(item, messages).trim()).not.toBe('');
          expect(item.page ?? item.pages).toBeDefined();
        }
      }
    }
  });

  it('lists every titled page in the navigation', () => {
    expect(Object.keys(en.nav.pages).sort()).toEqual(PAGES.map(page => page.path).sort());
  });

  it('lists the pages in navigation order', () => {
    expect(PAGES[0]?.path).toBe('overview');
    expect(PAGES.at(-1)?.path).toBe('reference/coming-from-angular');
  });
});

describe('pageTitle', () => {
  it('reads the title of a page in the given language', () => {
    expect(pageTitle(findPage('signals/computed')!, en)).toBe('Computed signals');
    expect(pageTitle(findPage('signals/computed')!, it_)).toBe('Signal derivati (computed)');
  });

  it('reads the title of the home page', () => {
    expect(pageTitle(HOME_PAGE, en)).toBe('Home');
  });
});

describe('itemTitle', () => {
  it('labels a group with its own title', () => {
    const essentials = NAV[0]!.items.find(item => item.group === 'essentials')!;
    expect(itemTitle(essentials, it_)).toBe('Fondamenti');
  });

  it('labels a link with the title of its page', () => {
    const overview = NAV[0]!.items.find(item => item.page?.path === 'overview')!;
    expect(itemTitle(overview, en)).toBe('What is Xaendar?');
  });
});

describe('findPage', () => {
  it('finds a page by path', () => {
    expect(findPage('signals/computed')?.path).toBe('signals/computed');
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
    expect(searchPages('   ', en)).toEqual([]);
  });

  it('matches titles in the given language', () => {
    expect(searchPages('derivati', it_).map(page => page.path)).toContain('signals/computed');
    expect(searchPages('computed signals', en).map(page => page.path)).toContain('signals/computed');
  });

  it('matches keywords and paths', () => {
    expect(searchPages('microtask', en).map(page => page.path)).toEqual(['signals/effects']);
    expect(searchPages('templates/for', en).map(page => page.path)).toEqual(['templates/for']);
  });

  it('requires every word to match', () => {
    expect(searchPages('computed zzz', en)).toEqual([]);
  });

  it('ranks title matches first', () => {
    expect(searchPages('effect', en)[0]?.path).toBe('signals/effects');
  });

  it('limits the results', () => {
    expect(searchPages('e', en, 3)).toHaveLength(3);
  });
});
