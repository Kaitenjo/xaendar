import { describe, expect, it } from 'vitest';
import { _escapeAttribute, _escapeRawText, _escapeText } from './escape.util';

describe('escape helpers', () => {
  it('converts the value of an interpolation as a text node, and escapes it', () => {
    expect(_escapeText('<b> & </b>')).toBe('&lt;b&gt; &amp; &lt;/b&gt;');
    expect(_escapeText(null)).toBe('null');
    expect(() => _escapeText(Symbol('x'))).toThrow(TypeError);
  });

  it('converts the value of an attribute as the client writes it, and escapes it', () => {
    expect(_escapeAttribute('"a" & <b>')).toBe('&quot;a&quot; &amp; &lt;b&gt;');
    expect(_escapeAttribute(Symbol('x'))).toBe('Symbol(x)');
  });

  it('writes the value of an interpolation in a raw text element as it is, except for its end tag', () => {
    expect(_escapeRawText('a < b </style>', 'style')).toBe('a < b <\\/style>');
    expect(_escapeRawText(1, 'script')).toBe('1');
  });
});
