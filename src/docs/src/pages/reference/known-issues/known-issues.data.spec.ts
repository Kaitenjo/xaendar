import { describe, expect, it } from 'vitest';
import { PAGES } from '../../../core/routes/routes';
import { ISSUES } from './known-issues.data';

describe('known issues', () => {
  it('links every issue to a page and describes it in every language', () => {
    for (const entry of ISSUES) {
      expect(PAGES.some(page => page.path === entry.page)).toBe(true);
      for (const text of [entry.title.en, entry.title.it, entry.details.en, entry.details.it, entry.workaround.en, entry.workaround.it]) {
        expect(text.trim()).not.toBe('');
      }
    }
  });
});
