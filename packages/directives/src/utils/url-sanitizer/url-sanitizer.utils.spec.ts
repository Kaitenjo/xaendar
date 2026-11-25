import { describe, expect, it } from 'vitest';
import { decodeCharacterReferences, isSafeAnimationTarget, isSafeSrcset, isSafeUrl, isSafeUrlAttribute, isTrustedResource } from './url-sanitizer.utils';

/**
 * The schemes allowed by default.
 */
const schemes: ReadonlySet<string> = new Set(['ftp', 'http', 'https', 'mailto', 'sms', 'tel']);

describe('isSafeUrl', () => {
  it('allows the relative URLs and the URLs of the schemes allowed, in any case', () => {
    const urls = ['', ' ', '/a ', 'a/b:c', '?q=a:b', '#x:y', '//host/x', 'https://x', 'HTTP://x', 'mailto:a@b', 'tel:+39'];

    expect(urls.every(url => isSafeUrl(url, schemes))).toBe(true);
  });

  it('refuses the URLs of the schemes not allowed, however they are written', () => {
    const tab = String.fromCharCode(9);
    const urls = ['javascript:alert(1)', 'JavaScript:x', ' javascript:x', `java${tab}script:x`, `java${String.fromCharCode(10)}script:x`, `${String.fromCharCode(1)}javascript:x`, 'vbscript:x', 'data:text/html,<script>', 'file:///etc'];

    expect(urls.some(url => isSafeUrl(url, schemes))).toBe(false);
  });

  it('refuses a URL holding a character reference not decoded before its first /, ? or #', () => {
    expect(isSafeUrl('javascript&foo;x', schemes)).toBe(false);
    expect(isSafeUrl('/a?b=1&c=2', schemes)).toBe(true);
  });

  it('allows the data: URLs of the images, the audios and the videos in base64 only', () => {
    expect(isSafeUrl('data:image/png;base64,iVBORw0KGgo=', schemes)).toBe(true);
    expect(isSafeUrl('data:video/mp4;base64,AAAA', schemes)).toBe(true);
    expect(isSafeUrl('data:image/svg+xml;base64,PHN2Zz4=', schemes)).toBe(false);
    expect(isSafeUrl('data:image/png,raw', schemes)).toBe(false);
  });

  it('allows any data: URL when data is among the schemes', () => {
    expect(isSafeUrl('data:text/plain,hi', new Set(['data']))).toBe(true);
  });
});

describe('isSafeSrcset', () => {
  it('checks the URL of every candidate', () => {
    expect(isSafeSrcset('a.png 1x, https://x/b.png 2x,c.png', schemes)).toBe(true);
    expect(isSafeSrcset('a.png 1x, javascript:x 2x', schemes)).toBe(false);
    expect(isSafeSrcset('a.png,, javascript:x', schemes)).toBe(false);
  });

  it('reads a , inside a URL as part of it, as the browser does: a.png,javascript:x is a relative URL', () => {
    expect(isSafeSrcset('a.png,javascript:x', schemes)).toBe(true);
  });

  it('reads the descriptors up to the , outside parentheses, and a URL ending with , as its candidate', () => {
    expect(isSafeSrcset('a.png (x, y), javascript:x', schemes)).toBe(false);
    expect(isSafeSrcset('a.png (x, y)) z', schemes)).toBe(true);
    expect(isSafeSrcset(' , a.png,, b.png ', schemes)).toBe(true);
  });

  it('reads a data: URL with its comma as a single URL', () => {
    expect(isSafeSrcset('data:image/png;base64,iVBO 1x', schemes)).toBe(true);
  });
});

describe('decodeCharacterReferences', () => {
  it('decodes the numeric references, with or without ;, and the named ones listed', () => {
    expect(decodeCharacterReferences('&#106;&#x61;&#X76&#97;&colon;&Tab;&NewLine;&amp;')).toBe(`java:${String.fromCharCode(9)}${String.fromCharCode(10)}&`);
  });

  it('decodes the invalid numeric references to U+FFFD, and keeps the named ones not listed', () => {
    const replacement = String.fromCharCode(0xfffd);

    expect(decodeCharacterReferences('&#0;&#xD800;&#x110000;&copy;')).toBe(`${replacement}${replacement}${replacement}&copy;`);
  });

  it('decodes the characters out of the basic plane', () => {
    expect(decodeCharacterReferences('&#x1F600;')).toBe(String.fromCodePoint(0x1f600));
  });

  it('returns a value without & as it is', () => {
    expect(decodeCharacterReferences('/a')).toBe('/a');
  });
});

describe('isTrustedResource', () => {
  it('keeps a resource loaded from the application or from a trusted origin, decoding the references of its URL', () => {
    const trusted = ['https://cdn.example.com'];

    expect(isTrustedResource('iframe', 'src', '/frame.html', trusted)).toBe(true);
    expect(isTrustedResource('iframe', 'src', 'https://cdn.example.com/frame.html', trusted)).toBe(true);
    expect(isTrustedResource('iframe', 'src', 'https://evil.com/frame.html', trusted)).toBe(false);
    expect(isTrustedResource('embed', 'src', '//evil.com/x', trusted)).toBe(false);
    expect(isTrustedResource('object', 'data', 'https&#x3a;//evil.com/x', trusted)).toBe(false);
  });

  it('keeps the attributes loading no resource, and every resource when the project does not check them', () => {
    expect(isTrustedResource('img', 'src', 'https://evil.com/x.png', [])).toBe(true);
    expect(isTrustedResource('iframe', 'title', 'https://evil.com/', [])).toBe(true);
    expect(isTrustedResource('iframe', 'src', 'https://evil.com/frame.html', null)).toBe(true);
  });
});

describe('isSafeUrlAttribute', () => {
  it('checks the attributes holding a URL, decoding their references', () => {
    expect(isSafeUrlAttribute('href', '&#106;avascript:x', schemes)).toBe(false);
    expect(isSafeUrlAttribute('href', 'javascript&colon;x', schemes)).toBe(false);
    expect(isSafeUrlAttribute('xlink:href', 'javascript:x', schemes)).toBe(false);
    expect(isSafeUrlAttribute('src', '/a.png', schemes)).toBe(true);
  });

  it('checks every URL of a srcset and of a ping', () => {
    expect(isSafeUrlAttribute('srcset', 'a.png, &#106;avascript:x 2x', schemes)).toBe(false);
    expect(isSafeUrlAttribute('ping', '/a https://b', schemes)).toBe(true);
    expect(isSafeUrlAttribute('ping', '/a javascript:x', schemes)).toBe(false);
  });

  it('allows the other attributes whatever their value', () => {
    expect(isSafeUrlAttribute('title', 'javascript:x', schemes)).toBe(true);
  });

  it('checks the images of an imagesrcset', () => {
    expect(isSafeUrlAttribute('imagesrcset', 'a.png 1x, javascript:x 2x', schemes)).toBe(false);
  });
});

describe('isSafeAnimationTarget', () => {
  it('rejects an SVG animation writing an href, decoding the references', () => {
    expect(isSafeAnimationTarget('set', 'attributename', 'href')).toBe(false);
    expect(isSafeAnimationTarget('animatemotion', 'attributename', '&#104;ref')).toBe(false);
    expect(isSafeAnimationTarget('animate', 'attributename', 'xlink:href')).toBe(false);
  });

  it('allows any other attribute', () => {
    expect(isSafeAnimationTarget('animate', 'attributename', 'opacity')).toBe(true);
    expect(isSafeAnimationTarget('animate', 'to', 'href')).toBe(true);
    expect(isSafeAnimationTarget('a', 'attributename', 'href')).toBe(true);
  });
});
