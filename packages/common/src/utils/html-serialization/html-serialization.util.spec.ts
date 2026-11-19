import { describe, expect, it } from 'vitest';
import { dropsLeadingNewline, escapeAttribute, escapeRawText, escapeText, isRawTextElement, isVoidElement } from './html-serialization.util';

describe('html serialization', () => {
  it('escapes &, < and > in a text, leaving the quotes as they are', () => {
    expect(escapeText('a < b && c > "d" \'e\'')).toBe('a &lt; b &amp;&amp; c &gt; "d" \'e\'');
  });

  it('escapes &, ", < and > in the value of an attribute', () => {
    expect(escapeAttribute('say "hi" & <go> \'now\'')).toBe('say &quot;hi&quot; &amp; &lt;go&gt; \'now\'');
  });

  it('escapes the slash of the sequences ending a raw text element, whatever their case', () => {
    expect(escapeRawText('a</script>b</SCRIPT c</style>', 'script')).toBe('a<\\/script>b<\\/SCRIPT c</style>');
    expect(escapeRawText('a > b & c', 'style')).toBe('a > b & c');
  });

  it('tells the void elements', () => {
    expect(isVoidElement('input')).toBe(true);
    expect(isVoidElement('br')).toBe(true);
    expect(isVoidElement('div')).toBe(false);
  });

  it('tells the elements whose text is written as it is', () => {
    expect(isRawTextElement('script')).toBe(true);
    expect(isRawTextElement('style')).toBe(true);
    expect(isRawTextElement('textarea')).toBe(false);
  });

  it('tells the elements dropping a line feed after their start tag', () => {
    expect(dropsLeadingNewline('pre')).toBe(true);
    expect(dropsLeadingNewline('textarea')).toBe(true);
    expect(dropsLeadingNewline('div')).toBe(false);
  });
});
