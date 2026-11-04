import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import type { HydrateNode } from '../../types/nodes/hydrate-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseHydrate', () => {
  it('parses the triggers and the content', () => {
    const template = '@hydrate (idle, when ready()) { <b></b> }';
    const [node] = parse(template) as HydrateNode[];

    expect(node).toMatchObject({ type: ASTNodeType.Hydrate, span: { start: 0, end: template.length } });
    expect(node.triggers.map(({ kind }) => kind)).toEqual(['idle', 'when']);
    expect(node.children).toHaveLength(1);
  });

  it('accepts the triggers watching the content without anything else', () => {
    const [node] = parse('@hydrate (visible, interaction) { text }') as HydrateNode[];

    expect(node.triggers.map(({ kind }) => kind)).toEqual(['visible', 'interaction']);
  });

  it('throws when the triggers are missing', () => {
    const tokens: Token[] = [{ type: TokenType.HYDRATE, span: { start: 0, end: 8 } }];

    expect(() => new Parser('', tokens).parse()).toThrow('Expected the triggers of @hydrate between parentheses, got EOF');
  });
});
