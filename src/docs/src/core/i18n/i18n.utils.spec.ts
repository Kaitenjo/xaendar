import { describe, expect, it } from 'vitest';
import { translate } from './i18n.utils';

describe('translate', () => {
  const messages = { pager: { next: 'Next' }, pages: { home: { lead: '<code>x</code>' } } };

  it('reads a text by its dot-separated key', () => {
    expect(translate(messages, 'pager.next')).toBe('Next');
    expect(translate(messages, 'pages.home.lead')).toBe('<code>x</code>');
  });

  it('returns the key when no text has it', () => {
    expect(translate(messages, 'pager.previous')).toBe('pager.previous');
    expect(translate(messages, 'pager.next.deeper')).toBe('pager.next.deeper');
  });

  it('returns the key when it names a group of texts', () => {
    expect(translate(messages, 'pages.home')).toBe('pages.home');
  });

  it('returns the key when the messages are not an object', () => {
    expect(translate(null, 'pager')).toBe('pager');
  });
});
