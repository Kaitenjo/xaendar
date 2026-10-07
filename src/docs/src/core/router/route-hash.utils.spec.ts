import { describe, expect, it } from 'vitest';
import { formatHash, isLang, parseHash } from './route-hash.utils';

describe('isLang', () => {
  it('accepts the documentation languages', () => {
    expect(isLang('en')).toBe(true);
    expect(isLang('it')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isLang('fr')).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});

describe('parseHash', () => {
  it('reads the language and the path', () => {
    expect(parseHash('#/it/signals/computed', 'en')).toEqual({ lang: 'it', path: 'signals/computed' });
  });

  it('accepts a hash without the leading #', () => {
    expect(parseHash('/en/overview', 'it')).toEqual({ lang: 'en', path: 'overview' });
  });

  it('points to the home page when only the language is given', () => {
    expect(parseHash('#/en', 'it')).toEqual({ lang: 'en', path: '' });
    expect(parseHash('#/en/', 'it')).toEqual({ lang: 'en', path: '' });
  });

  it('falls back to the given language when the hash has none', () => {
    expect(parseHash('#/signals/computed', 'it')).toEqual({ lang: 'it', path: 'signals/computed' });
    expect(parseHash('', 'en')).toEqual({ lang: 'en', path: '' });
  });

  it('ignores empty segments', () => {
    expect(parseHash('#//it//templates///for/', 'en')).toEqual({ lang: 'it', path: 'templates/for' });
  });
});

describe('formatHash', () => {
  it('formats a page route', () => {
    expect(formatHash({ lang: 'it', path: 'signals/computed' })).toBe('#/it/signals/computed');
  });

  it('formats the home page', () => {
    expect(formatHash({ lang: 'en', path: '' })).toBe('#/en');
  });

  it('is the inverse of parseHash', () => {
    const route = { lang: 'en' as const, path: 'components/queries' };
    expect(parseHash(formatHash(route), 'it')).toEqual(route);
  });
});
