import { describe, expect, it } from 'vitest';
import { PAGES } from '../../../core/routes/routes';
import en from '../../../i18n/en.json';
import it_ from '../../../i18n/it.json';
import { ERRORS } from './errors.data';

describe('error encyclopedia', () => {
  it('has unique messages', () => {
    const messages = ERRORS.map(entry => entry.message);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it('links every entry to a page and explains it in every language', () => {
    for (const entry of ERRORS) {
      expect(PAGES.some(page => page.path === entry.page)).toBe(true);
      for (const text of [en.errors[entry.message].cause, it_.errors[entry.message].cause, en.errors[entry.message].fix, it_.errors[entry.message].fix]) {
        expect(text.trim()).not.toBe('');
      }
    }
  });

  it('explains only documented messages', () => {
    expect(Object.keys(en.errors).sort()).toEqual(ERRORS.map(entry => entry.message).sort());
  });
});
