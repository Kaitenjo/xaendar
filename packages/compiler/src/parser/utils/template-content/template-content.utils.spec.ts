import { describe, expect, it } from 'vitest';
import type { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import type { ElementNode } from '../../types/nodes/element-node.type';
import { assertStandardTemplate, serializeTemplateContent } from './template-content.utils';

const span = { start: 0, end: 1 };

const element = (tagName: string, children: ASTNode[] = [], attributes: ElementNode['attributes'] = []): ElementNode => ({
  type: ASTNodeType.Element,
  tagName,
  nameSpan: span,
  attributes,
  classBindings: [],
  styleBindings: [],
  events: [],
  children,
  conditionalBindings: [],
  directives: [],
  structuralDirectives: [],
  span
});

const text = (value: string): ASTNode => ({ type: ASTNodeType.Text, value, span });

describe('serializeTemplateContent', () => {
  it('serializes no content as an empty string', () => {
    expect(serializeTemplateContent([])).toBe('');
  });

  it('serializes texts and elements with static attributes, escaping them', () => {
    const attributes: ElementNode['attributes'] = [{ type: ASTNodeType.Attribute, name: 'title', nameSpan: span, value: 'a "b" & <c>', span }];
    expect(serializeTemplateContent([text('1 < 2 & 3'), element('b', [text('x')], attributes)])).toBe('1 &lt; 2 &amp; 3<b title="a &quot;b&quot; &amp; &lt;c&gt;">x</b>');
  });

  it('writes void elements without end tag, the leading line feed of a <pre>, and the text of a raw text element as it is', () => {
    expect(serializeTemplateContent([element('input'), element('pre', [text('a')]), element('script', [text('a < b')])])).toBe('<input><pre>\na</pre><script>a < b</script>');
  });

  it('throws for a node binding anything', () => {
    expect(() => serializeTemplateContent([{ type: ASTNodeType.Let, name: 'a', nameSpan: span, expression: undefined!, span } as unknown as ASTNode])).toThrow('The content of a <template> is static HTML');
  });
});

describe('assertStandardTemplate', () => {
  it('accepts attributes declaring no shadow root', () => {
    expect(() => assertStandardTemplate({ attributes: [{ type: ASTNodeType.Attribute, name: 'id', nameSpan: span, value: 'row', span }] })).not.toThrow();
  });

  it('throws for an attribute declaring a shadow root', () => {
    expect(() => assertStandardTemplate({ attributes: [{ type: ASTNodeType.Attribute, name: 'shadowrootmode', nameSpan: span, value: 'open', span }] })).toThrow('A <template> cannot declare a shadow root with "shadowrootmode"');
  });
});
