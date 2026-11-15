import { describe, expect, it } from 'vitest';
import { HtmlTokenizer } from './html-tokenizer.model';

/**
 * Reads every token of an HTML, each as a short description: `text:…`, `raw:…`, `<name a="1"/>`, `</name>`.
 */
function tokenize(html: string): string[] {
  const tokenizer = new HtmlTokenizer(html);
  const tokens = new Array<string>();
  while (tokenizer.next()) {
    switch (tokenizer.kind) {
      case 'text':
        tokens.push(`text:${tokenizer.text}`);
        break;
      case 'raw-text':
        tokens.push(`raw:${tokenizer.text}`);
        break;
      case 'start-tag':
        tokens.push(`<${tokenizer.name}${(tokenizer.attributes ?? []).map(({ name, value }) => ` ${name}="${value}"`).join('')}${tokenizer.selfClosing ? '/' : ''}>`);
        break;
      case 'end-tag':
        tokens.push(`</${tokenizer.name}>`);
        break;
    }
  }

  return tokens;
}

describe('HtmlTokenizer', () => {
  it('reads the texts, the start tags and the end tags, lowercasing their names', () => {
    expect(tokenize('Hi <B>there</B>!')).toEqual(['text:Hi ', '<b>', 'text:there', '</b>', 'text:!']);
  });

  it('reads nothing from an empty HTML', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('reads the attributes quoted, unquoted and without value, the first of each name only', () => {
    expect(tokenize('<a HREF="/x" title=\'a "b"\' data-x=1 hidden title="no">')).toEqual(['<a href="/x" title="a "b"" data-x="1" hidden="">']);
  });

  it('reads the attributes written without white space between them, and the values after white spaces around =', () => {
    expect(tokenize('<a x="1"y=\'2\'z = 3 =w>')).toEqual(['<a x="1" y="2" z="3" =w="">']);
  });

  it('reads a value missing before > as empty', () => {
    expect(tokenize('<a x=>t')).toEqual(['<a x="">', 'text:t']);
  });

  it('tells a tag closing itself, only with /> at its end', () => {
    expect(tokenize('<br/><br / ><img src=x/>')).toEqual(['<br/>', '<br>', '<img src="x/">']);
  });

  it('keeps the character references of the texts and of the values as they are written', () => {
    expect(tokenize('<a href="&#106;s">&lt;&amp;</a>')).toEqual(['<a href="&#106;s">', 'text:&lt;&amp;', '</a>']);
  });

  it('skips the comments, ended by -->, --!>, or right after <!-- by > or ->', () => {
    expect(tokenize('a<!-- <b> -->b<!-- x --!>c<!-->d<!--->e<!---->f')).toEqual(['text:a', 'text:b', 'text:c', 'text:d', 'text:e', 'text:f']);
  });

  it('skips a comment never ended up to the end', () => {
    expect(tokenize('a<!-- <b>')).toEqual(['text:a']);
  });

  it('skips the doctypes, the CDATA sections, the processing instructions and the bogus comments', () => {
    expect(tokenize('<!DOCTYPE html>a<![CDATA[<b>]]>b<?xml x?>c</>d</1 x>e<!x')).toEqual(['text:a', 'text:]]>b', 'text:c', 'text:d', 'text:e']);
  });

  it('reads a < starting no markup as a text', () => {
    expect(tokenize('1 < 2 <3')).toEqual(['text:1 ', 'text:<', 'text: 2 ', 'text:<', 'text:3']);
  });

  it('reads a </ at the end as a text', () => {
    expect(tokenize('a</')).toEqual(['text:a', 'text:</']);
  });

  it('drops a tag the input ends inside of, wherever it ends', () => {
    expect(tokenize('a<b')).toEqual(['text:a']);
    expect(tokenize('a<b x')).toEqual(['text:a']);
    expect(tokenize('a<b x="1')).toEqual(['text:a']);
    expect(tokenize('a<b x=1')).toEqual(['text:a']);
    expect(tokenize('a</b')).toEqual(['text:a']);
  });

  it('reads the attributes of an end tag and drops them', () => {
    expect(tokenize('</b class="x">')).toEqual(['</b>']);
  });

  it('reads the content of an element holding raw text up to its end tag, in any case', () => {
    expect(tokenize('<script>if (a<b) "</scriptx>"</SCRIPT >t')).toEqual(['<script>', 'raw:if (a<b) "</scriptx>"', '</script>', 'text:t']);
    expect(tokenize('<style><b></style>')).toEqual(['<style>', 'raw:<b>', '</style>']);
  });

  it('reads the content of a textarea and of a title as a text, whose references the browser decodes', () => {
    expect(tokenize('<textarea><b>&lt;</textarea>')).toEqual(['<textarea>', 'text:<b>&lt;', '</textarea>']);
  });

  it('reads the raw text of an element never ended up to the end, and a plaintext always', () => {
    expect(tokenize('<xmp>a</xmp')).toEqual(['<xmp>', 'raw:a</xmp']);
    expect(tokenize('<plaintext>a</plaintext>b')).toEqual(['<plaintext>', 'raw:a</plaintext>b']);
  });

  it('reads no token for an element holding raw text without content', () => {
    expect(tokenize('<script></script>')).toEqual(['<script>', '</script>']);
  });

  it('reads as raw text the content of an element holding raw text even when its start tag closes itself', () => {
    expect(tokenize('<script/><b></script>')).toEqual(['<script/>', 'raw:<b>', '</script>']);
  });
});
