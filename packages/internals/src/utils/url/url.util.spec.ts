import { describe, expect, it } from 'vitest';
import { cleanUrl, everySrcsetUrl, holdsUnsafeUrl, holdsUrls, isMediaDataUrl, isResourceUrlAttribute, isUnsafeUrl, isUntrustedResourceUrl, isUrlAttribute, readUrlOrigin, readUrlScheme } from './url.util';

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

describe('holdsUrls()', () => {
  it('tells the attributes holding one URL or a list of them', () => {
    expect(holdsUrls('href')).toBe(true);
    expect(holdsUrls('srcset')).toBe(true);
    expect(holdsUrls('imagesrcset')).toBe(true);
    expect(holdsUrls('ping')).toBe(true);
    expect(holdsUrls('title')).toBe(false);
  });
});

describe('holdsUnsafeUrl()', () => {
  it('checks the single URL of an attribute', () => {
    expect(holdsUnsafeUrl('href', 'javascript:alert(1)')).toBe(true);
    expect(holdsUnsafeUrl('href', '/home')).toBe(false);
  });

  it('checks every image of a srcset', () => {
    expect(holdsUnsafeUrl('srcset', 'a.png 1x, javascript:alert(1) 2x')).toBe(true);
    expect(holdsUnsafeUrl('imagesrcset', 'a.png 1x, b.png 2x')).toBe(false);
  });

  it('checks every URL of a ping', () => {
    expect(holdsUnsafeUrl('ping', '/track  javascript:alert(1)')).toBe(true);
    expect(holdsUnsafeUrl('ping', '/track https://a.b/c')).toBe(false);
  });
});

describe('everySrcsetUrl()', () => {
  it('reads the URL of each candidate, as the browser reads them', () => {
    const urls = new Array<string>();
    expect(everySrcsetUrl(' a.png 1x,b.png,, c.png (x, y) 2x , d.png', url => urls.push(url) > 0)).toBe(true);
    expect(urls).toEqual(['a.png', 'b.png', 'c.png', 'd.png']);
  });

  it('stops at the first URL failing the test', () => {
    expect(everySrcsetUrl('a.png 1x, bad.png (2x)) 2x', url => url !== 'bad.png')).toBe(false);
  });
});

describe('isResourceUrlAttribute()', () => {
  it('tells the attributes loading a resource into the page', () => {
    expect(isResourceUrlAttribute('iframe', 'src')).toBe(true);
    expect(isResourceUrlAttribute('object', 'data')).toBe(true);
    expect(isResourceUrlAttribute('base', 'href')).toBe(true);
    expect(isResourceUrlAttribute('img', 'src')).toBe(false);
    expect(isResourceUrlAttribute('iframe', 'name')).toBe(false);
  });
});

describe('isUntrustedResourceUrl()', () => {
  const trusted = ['https://cdn.example.com'];

  it.each([
    ['/frame.html'],
    ['frame.html'],
    ['https://cdn.example.com/frame.html'],
    ['  HTTPS://CDN.example.com/frame.html'],
    ['//cdn.example.com/frame.html']
  ])('trusts %j', url => {
    expect(isUntrustedResourceUrl(url, trusted)).toBe(false);
  });

  it.each([
    ['https://evil.com/frame.html'],
    ['//evil.com/frame.html'],
    ['/\\evil.com/frame.html'],
    ['http://cdn.example.com/frame.html'],
    ['javascript:alert(1)'],
    ['data:text/html,<p>']
  ])('does not trust %j', url => {
    expect(isUntrustedResourceUrl(url, trusted)).toBe(true);
  });
});

describe('readUrlOrigin()', () => {
  it('reads the origin of a URL, null for none', () => {
    expect(readUrlOrigin('https://a.b:8080/c')).toBe('https://a.b:8080');
    expect(readUrlOrigin('javascript:a')).toBe('null');
    expect(readUrlOrigin('http://[')).toBe('null');
  });
});
