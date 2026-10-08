import { describe, expect, it } from 'vitest';
import { PAGES } from '../../../core/routes/routes';
import { ERRORS } from './errors.data';

describe('error encyclopedia', () => {
  it('has unique messages', () => {
    const messages = ERRORS.map(entry => entry.message);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it('links every entry to a page and explains it in every language', () => {
    for (const entry of ERRORS) {
      expect(PAGES.some(page => page.path === entry.page)).toBe(true);
      for (const text of [entry.cause.en, entry.cause.it, entry.fix.en, entry.fix.it]) {
        expect(text.trim()).not.toBe('');
      }
    }
  });
});
