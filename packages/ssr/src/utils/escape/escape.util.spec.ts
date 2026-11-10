import { describe, expect, it } from 'vitest';
import { _escapeAttribute, _escapeRawText, _escapeText, _ssrAttribute } from './escape.util';

describe('escape helpers', () => {
  it('converts the value of an interpolation as the browser renders it, and escapes it', () => {
    expect(_escapeText('<b> & </b>')).toBe('&lt;b&gt; &amp; &lt;/b&gt;');
    expect(_escapeText(null)).toBe('');
    expect(_escapeText(undefined)).toBe('');
    expect(_escapeText(0)).toBe('0');
    expect(() => _escapeText(Symbol('x'))).toThrow(TypeError);
  });

  it('converts the value of an attribute as the client writes it, and escapes it', () => {
    expect(_escapeAttribute('"a" & <b>')).toBe('&quot;a&quot; &amp; &lt;b&gt;');
    expect(_escapeAttribute(Symbol('x'))).toBe('Symbol(x)');
  });

  it('writes a bound attribute with its value escaped, and leaves it out for null and undefined, as the client removes it', () => {
    expect(_ssrAttribute('title', '"a" & <b>')).toBe(' title="&quot;a&quot; &amp; &lt;b&gt;"');
    expect(_ssrAttribute('title', false)).toBe(' title="false"');
    expect(_ssrAttribute('tabindex', 0)).toBe(' tabindex="0"');
    expect(_ssrAttribute('title', null)).toBe('');
    expect(_ssrAttribute('title', undefined)).toBe('');
  });

  it('writes the value of an interpolation in a raw text element as it is, except for its end tag', () => {
    expect(_escapeRawText('a < b </style>', 'style')).toBe('a < b <\\/style>');
    expect(_escapeRawText(1, 'script')).toBe('1');
    expect(_escapeRawText(undefined, 'script')).toBe('');
  });
});
