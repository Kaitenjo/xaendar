import { describe, expect, it } from 'vitest';
import { cleanUrl, isMediaDataUrl, isUnsafeUrl, isUrlAttribute, readUrlScheme } from './url.util';

const TAB = String.fromCharCode(9);
const LINE_FEED = String.fromCharCode(10);
const CARRIAGE_RETURN = String.fromCharCode(13);
const NULL = String.fromCharCode(0);

describe('isUrlAttribute()', () => {
  it('tells the attributes holding a single URL, of HTML and of SVG', () => {
    expect(isUrlAttribute('href')).toBe(true);
    expect(isUrlAttribute('xlink:href')).toBe(true);
    expect(isUrlAttribute('formaction')).toBe(true);
    expect(isUrlAttribute('srcset')).toBe(false);
    expect(isUrlAttribute('title')).toBe(false);
  });
});

describe('cleanUrl()', () => {
  it('removes the control characters and the spaces at the ends, and the tabs and the line breaks anywhere', () => {
    expect(cleanUrl(`${NULL} java${TAB}scr${LINE_FEED}ipt${CARRIAGE_RETURN}:a b `)).toBe('javascript:a b');
    expect(cleanUrl('   ')).toBe('');
  });
});

describe('readUrlScheme()', () => {
  it('reads the scheme, lowercase, and none for a relative URL', () => {
    expect(readUrlScheme('HTTPS://a.b')).toBe('https');
    expect(readUrlScheme('a/b:c')).toBeUndefined();
    expect(readUrlScheme('/path')).toBeUndefined();
  });
});

describe('isMediaDataUrl()', () => {
  it('tells the data: URLs of an image, an audio or a video in base64', () => {
    expect(isMediaDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isMediaDataUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
  });
});

describe('isUnsafeUrl()', () => {
  it.each([
    ['javascript:alert(1)'],
    [' JavaScript:alert(1)'],
    [`java${TAB}script:alert(1)`],
    ['vbscript:msgbox(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['data:image/svg+xml;base64,PHN2Zz4=']
  ])('tells %j runs code', url => {
    expect(isUnsafeUrl(url)).toBe(true);
  });

  it.each([
    ['https://example.com'],
    ['mailto:a@b.c'],
    ['myapp:open'],
    ['/path?javascript:a'],
    ['page#javascript:a'],
    ['data:image/png;base64,iVBORw0KGgo='],
    ['']
  ])('tells %j runs no code', url => {
    expect(isUnsafeUrl(url)).toBe(false);
  });
});
