import { describe, expect, it } from 'vitest';
import { translate } from '../core/i18n/i18n.utils';
import en from './en.json';
import it_ from './it.json';

/**
 * Lists the keys of every text of a language.
 *
 * @param node - The texts, or a group of them.
 * @param prefix - The key of the group.
 * @returns The dot-separated keys of the texts.
 */
function keysOf(node: unknown, prefix = ''): string[] {
  if (node === null || typeof node !== 'object') {
    return [prefix];
  }
  return Object.entries(node).flatMap(([key, value]) => keysOf(value, prefix ? `${prefix}.${key}` : key));
}

/**
 * The templates of the site, by path.
 */
const templates = import.meta.glob<string>('../**/*.xd.component.html', { query: '?raw', import: 'default', eager: true });

describe('messages', () => {
  it('gives every language the same texts', () => {
    expect(keysOf(it_)).toEqual(keysOf(en));
  });

  it('has no empty text', () => {
    for (const messages of [en, it_]) {
      for (const key of keysOf(messages)) {
        expect(typeof translate(messages, key) === 'string' && translate(messages, key).trim(), key).toBeTruthy();
      }
    }
  });

  it('has a text for every key used by the templates', () => {
    const keys = Object.values(templates).flatMap(source => [
      ...[...source.matchAll(/@@i18n\(key="([^"]+)"\)/g)].map(([, key]) => key!),
      ...[...source.matchAll(/\{ t\(\)\.([\w.]+) \}/g)].map(([, key]) => key!)
    ]);

    expect(keys.length).toBeGreaterThan(0);
    for (const messages of [en, it_]) {
      expect(keys.filter(key => translate(messages, key) === key)).toEqual([]);
    }
  });

  it('links every page in its own language', () => {
    expect(JSON.stringify(en.pages)).not.toContain('href=\\"#/it');
    expect(JSON.stringify(it_.pages)).not.toContain('href=\\"#/en');
  });
});
