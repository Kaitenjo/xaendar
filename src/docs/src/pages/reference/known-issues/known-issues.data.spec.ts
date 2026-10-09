import { describe, expect, it } from 'vitest';
import { PAGES } from '../../../core/routes/routes';
import en from '../../../i18n/en.json';
import it_ from '../../../i18n/it.json';
import { ISSUES } from './known-issues.data';

describe('known issues', () => {
  it('links every issue to a page and describes it in every language', () => {
    for (const entry of ISSUES) {
      expect(PAGES.some(page => page.path === entry.page)).toBe(true);
      for (const text of [en, it_].flatMap(messages => Object.values(messages.issues[entry.id]))) {
        expect(text.trim()).not.toBe('');
      }
    }
  });

  it('has unique ids, each with its texts', () => {
    expect(Object.keys(en.issues).sort()).toEqual(ISSUES.map(entry => entry.id).sort());
  });
});
