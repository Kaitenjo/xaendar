import { CompilerContext, parseTemplate, type ElementNode, type InterpolationNode, type TextNode } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { generateServerText } from './generate-server-text.state';

/**
 * Parses the text or the interpolation of a template, the content of a `<p>`.
 */
const parseContent = (content: string): TextNode | InterpolationNode => (parseTemplate(`<p>${content}</p>`)[0] as ElementNode).children[0] as TextNode | InterpolationNode;

describe('generateServerText', () => {
  it('escapes a text when the template is compiled', () => {
    expect(generateServerText(parseContent('a &lt; b &amp; c'), { id: 'p0', tag: 'p' }, '0', new CompilerContext())).toEqual({ pieces: [{ html: 'a &lt; b &amp; c' }] });
  });

  it('escapes the value of an interpolation when it is rendered, reading the globals of the browser through globalThis', () => {
    expect(generateServerText(parseContent('{ title + innerWidth }'), { id: 'root' }, '0', new CompilerContext())).toEqual({
      pieces: [{ value: '_escapeText(this.title + globalThis.innerWidth)' }]
    });
  });

  it('writes as it is the text of an element of the HTML namespace whose content the parser does not decode', () => {
    expect(generateServerText(parseContent('a &gt; b'), { id: 'style0', tag: 'style' }, '0', new CompilerContext())).toEqual({ pieces: [{ html: 'a > b' }] });
    expect(generateServerText(parseContent('{ code }'), { id: 'script0', tag: 'script' }, '0', new CompilerContext())).toEqual({
      pieces: [{ value: '_escapeRawText(this.code, \'script\')' }]
    });
  });

  it('escapes the text of an element named like one whose content is not decoded in another namespace', () => {
    expect(generateServerText(parseContent('a &gt; b'), { id: 'style0', tag: 'style' }, '0', new CompilerContext(undefined, 'svg'))).toEqual({ pieces: [{ html: 'a &gt; b' }] });
  });
});
