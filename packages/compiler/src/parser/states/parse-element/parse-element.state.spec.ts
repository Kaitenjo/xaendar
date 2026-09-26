import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { ElementNode } from '../../types/nodes/element-node.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();
const parseTokens = (tokens: Token[]) => new Parser('', tokens).parse();

describe('parseElement', () => {
  it('parses an element with children', () => {
    const [node] = parse('<div>text<span></span></div>') as ElementNode[];
    expect(node.tagName).toBe('div');
    expect(node.children.map(c => c.type)).toEqual([ASTNodeType.Text, ASTNodeType.Element]);
  });

  it('parses a self-closing element', () => {
    const [node] = parse('<input />') as ElementNode[];
    expect(node).toMatchObject({ tagName: 'input', children: [] });
  });

  it('parses attributes, events and dynamic bindings', () => {
    const [node] = parse('<div class="a" @click="f()" @(cond(), title="x")></div>') as ElementNode[];
    expect(node.attributes).toHaveLength(1);
    expect(node.events).toHaveLength(1);
    expect(node.dynamicBindings).toHaveLength(1);
  });

  it('skips children for which parseNode returns nothing', () => {
    const tokens: Token[] = [
      { type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } },
      { type: TokenType.TAG_OPEN_END, parts: [], span: { start: 4, end: 5 } },
      { type: TokenType.TAG_CLOSE_NAME, parts: ['div'], span: { start: 5, end: 11 } }
    ];
    expect(parseTokens(tokens)).toHaveLength(1);
  });

  it('throws when the opening tag is not terminated', () => {
    const tokens: Token[] = [{ type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } }];
    expect(() => parseTokens(tokens)).toThrow('Unexpected token');
  });

  it('throws when the closing tag is missing', () => {
    const tokens: Token[] = [
      { type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } },
      { type: TokenType.TAG_OPEN_END, parts: [], span: { start: 4, end: 5 } }
    ];
    expect(() => parseTokens(tokens)).toThrow('Expected closing tag div while file is over');
  });

  it('throws when the closing tag does not match', () => {
    expect(() => parse('<div></span>')).toThrow('Expected closing tag div, found span');
  });
});
