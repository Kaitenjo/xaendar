import { describe, expect, it } from 'vitest';
import { toSameOriginPath } from './url.util';

const BACKSLASH = String.fromCharCode(92);
const TAB = String.fromCharCode(9);
const LINE_FEED = String.fromCharCode(10);
const CARRIAGE_RETURN = String.fromCharCode(13);

describe('toSameOriginPath()', () => {
  it('keeps the path and the query string, dropping the fragment', () => {
    expect(toSameOriginPath('/search?q=tea#results')).toBe('/search?q=tea');
  });

  it('drops the origin of an absolute URL', () => {
    expect(toSameOriginPath('https://example.com/products/42?ref=mail')).toBe('/products/42?ref=mail');
    expect(toSameOriginPath('http://evil.com//x')).toBe('/x');
  });

  it('resolves the dot segments', () => {
    expect(toSameOriginPath('/a/../b/./c')).toBe('/b/c');
  });

  it('gives the root for an empty URL, and a path starting with a slash for a path without it', () => {
    expect(toSameOriginPath('')).toBe('/');
    expect(toSameOriginPath('about')).toBe('/about');
  });

  it('gives the root for a URL that cannot be parsed', () => {
    expect(toSameOriginPath('http://[/x')).toBe('/');
    expect(toSameOriginPath('http://evil.com:99999/x')).toBe('/');
  });

  it('reads a URL starting with slashes or backslashes as a path, never as a host', () => {
    expect(toSameOriginPath('//about')).toBe('/about');
    expect(toSameOriginPath('//evil.com/x?q=1')).toBe('/evil.com/x?q=1');
    expect(toSameOriginPath(`/${BACKSLASH}evil.com/x`)).toBe('/evil.com/x');
    expect(toSameOriginPath(`${BACKSLASH}${BACKSLASH}evil.com/x`)).toBe('/evil.com/x');
    expect(toSameOriginPath(`/${TAB}/evil.com/x`)).toBe('/evil.com/x');
    expect(toSameOriginPath(' //evil.com/x')).toBe('/evil.com/x');
  });

  it('removes the line breaks hiding a protocol', () => {
    expect(toSameOriginPath(`htt${CARRIAGE_RETURN}ps://evil.com/x`)).toBe('/x');
    expect(toSameOriginPath(`ht${LINE_FEED}tp://evil.com/x`)).toBe('/x');
  });

  it('keeps a single slash at the start of a path the dot segments leave starting with more', () => {
    expect(toSameOriginPath('/..//evil.com/x?q=1')).toBe('/evil.com/x?q=1');
  });

  it('gives a path that keeps the origin of any base it is resolved against', () => {
    const targets = ['//evil.com/x', '//host//evil.com/x', `//host/${BACKSLASH}evil.com/x`, '/..//evil.com/x', `/${BACKSLASH}${BACKSLASH}evil.com/x`, `/${TAB}/evil.com/x`, 'http://evil.com//evil.com/x', `htt${CARRIAGE_RETURN}ps://evil.com/x`];

    for (let i = 0; i < targets.length; i++) {
      expect(new URL(toSameOriginPath(targets[i]), 'https://api.example.com').origin).toBe('https://api.example.com');
    }
  });
});
