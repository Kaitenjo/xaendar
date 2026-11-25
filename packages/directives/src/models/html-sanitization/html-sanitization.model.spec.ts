import { describe, expect, it } from 'vitest';
import type { HtmlSanitizerPolicy } from '../../types/html-sanitizer-policy.type';
import { createAttributePolicy, createNamePolicy } from '../../utils/html-name-policy/html-name-policy.utils';
import { HtmlSanitization } from './html-sanitization.model';

/**
 * A policy keeping the elements and the attributes given, and the URLs of http and https.
 */
function policy(elements: string[], attributes: string[] = []): HtmlSanitizerPolicy {
  return {
    elements: createNamePolicy(new Set(elements), null, undefined, undefined),
    attributes: createAttributePolicy(new Set(attributes), null, undefined, undefined),
    urlSchemes: new Set(['http', 'https']),
    trustedOrigins: null
  };
}

/**
 * Sanitizes an HTML with a policy.
 */
function sanitize(html: string, elements: string[], attributes?: string[]): string {
  return new HtmlSanitization(policy(elements, attributes)).run(html).html;
}

describe('HtmlSanitization', () => {
  it('keeps the elements and the attributes allowed, encoding the texts and the values', () => {
    expect(sanitize('<p class=\'a "b" <c>\' id="x">1 < 2 > 0 &amp; &lt;</p>', ['p'], ['class'])).toBe('<p class="a &quot;b&quot; &lt;c&gt;">1 &lt; 2 &gt; 0 &amp; &lt;</p>');
  });

  it('removes the tags of the elements not allowed, keeping their content', () => {
    expect(sanitize('<div><x-y>a<b>b</b></x-y></div>', ['div'])).toBe('<div>ab</div>');
  });

  it('removes with their content the scripts, the styles, the templates and the fallbacks, nested ones included', () => {
    expect(sanitize('a<script>x</script>b<style>p{}</style>c<template><template>t</template>u</template>d', [])).toBe('abcd');
    expect(sanitize('a<noscript><b>n</b></noscript>b<iframe>i</iframe>c<object><p>o</p></object>d', [])).toBe('abcd');
    expect(sanitize('a<template/>b</template>c', [])).toBe('ac');
    expect(sanitize('a<plaintext>b</plaintext>c', [])).toBe('a');
    expect(sanitize('a<script>x', [])).toBe('a');
  });

  it('closes the elements left open, in order, and drops the end tags without start tag', () => {
    expect(sanitize('<div><b>a</div>c</b></div></p>', ['b', 'div', 'p'])).toBe('<div><b>a</b></div>c');
  });

  it('writes a void element without end tag, and a non-void one closing itself as an empty element', () => {
    expect(sanitize('<br/><img src=a.png><div/>t</br>', ['br', 'div', 'img'], ['src'])).toBe('<br><img src="a.png"><div></div>t');
  });

  it('closes the elements the HTML parser closes on its own', () => {
    expect(sanitize('<ul><li>a<li>b<ul><li>c</ul></ul>', ['li', 'ul'])).toBe('<ul><li>a</li><li>b<ul><li>c</li></ul></li></ul>');
    expect(sanitize('<p>a<div>b</div><p>c<p>d', ['div', 'p'])).toBe('<p>a</p><div>b</div><p>c</p><p>d</p>');
    expect(sanitize('<dl><dt>a<dd>b<dt>c</dl>', ['dd', 'dl', 'dt'])).toBe('<dl><dt>a</dt><dd>b</dd><dt>c</dt></dl>');
    expect(sanitize('<h1>a<h2>b', ['h1', 'h2'])).toBe('<h1>a</h1><h2>b</h2>');
    expect(sanitize('<a href="/1">a<a href="/2">b', ['a'], ['href'])).toBe('<a href="/1">a</a><a href="/2">b</a>');
    expect(sanitize('<ruby>a<rt>b<rp>c</ruby>', ['rp', 'rt', 'ruby'])).toBe('<ruby>a<rt>b</rt><rp>c</rp></ruby>');
  });

  it('closes the rows, the cells and the sections of a table, not the ones of an outer table', () => {
    expect(sanitize('<table><thead><tr><th>a<th>b<tbody><tr><td>c<tr><td>d</table>', ['table', 'tbody', 'td', 'th', 'thead', 'tr']))
      .toBe('<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>c</td></tr><tr><td>d</td></tr></tbody></table>');
    expect(sanitize('<table><tr><td><table><tr><td>a</table>b<td>c</table>', ['table', 'td', 'tr']))
      .toBe('<table><tr><td><table><tr><td>a</td></tr></table>b</td><td>c</td></tr></table>');
  });

  it('stops looking for the element to close at the boundary of its scope', () => {
    expect(sanitize('<p>a<button>b<div>c</div></button></p>', ['button', 'div', 'p'])).toBe('<p>a<button>b<div>c</div></button></p>');
    expect(sanitize('<li>a<div><li>b', ['div', 'li'])).toBe('<li>a<div></div></li><li>b</li>');
    expect(sanitize('<li>a<blockquote><li>b', ['blockquote', 'li'])).toBe('<li>a<blockquote><li>b</li></blockquote></li>');
    expect(sanitize('<h1><b><h2>', ['b', 'h1', 'h2'])).toBe('<h1><b><h2></h2></b></h1>');
  });

  it('encodes only the < of the raw text of an element allowed', () => {
    expect(sanitize('<style>a > b { content: "</style>', ['style'])).toBe('<style>a > b { content: "</style>');
    expect(sanitize('<style>x</p><img src=x onerror=alert(1)></style>', ['style'])).toBe('<style>x&lt;/p>&lt;img src=x onerror=alert(1)></style>');
  });

  it('writes as a text the raw text of an element removed with its tags only', () => {
    expect(sanitize('<xmp><b>x</b></xmp>', [])).toBe('&lt;b>x&lt;/b>');
  });

  it('removes the attributes not allowed, and the ones holding a URL not allowed', () => {
    expect(sanitize('<a href="javascript:alert(1)" onclick="x()" title="t">a</a>', ['a'], ['href', 'title'])).toBe('<a title="t">a</a>');
  });

  it('reports the elements and the attributes removed, each once', () => {
    const result = new HtmlSanitization(policy(['a'], ['href'])).run('<a href="javascript:x" onclick="y">1</a><script>1</script><script>2</script><a onclick="z">');

    expect(result.report).toEqual({ removedElements: ['script'], removedAttributes: ['a[href]', 'a[onclick]'] });
  });

  it('reports only the attributes, or only the elements, removed', () => {
    expect(new HtmlSanitization(policy(['a'])).run('<a x>').report).toEqual({ removedElements: [], removedAttributes: ['a[x]'] });
    expect(new HtmlSanitization(policy([])).run('<a>').report).toEqual({ removedElements: ['a'], removedAttributes: [] });
  });

  it('reports nothing when nothing is removed, the comments aside', () => {
    expect(new HtmlSanitization(policy(['b'])).run('<b>x</b><!-- c -->')).toEqual({ html: '<b>x</b>', report: undefined });
  });
});
