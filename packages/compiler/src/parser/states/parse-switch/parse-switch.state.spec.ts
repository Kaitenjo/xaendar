import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { SwitchNode } from '../../types/nodes/switch-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseSwitchControlFlow', () => {
  it('parses cases, grouped cases and default', () => {
    const [node] = parse('@switch (x) { @case (1) { <a></a> } @case (2) @case (3) { <b></b> } @default { <c></c> } }') as SwitchNode[];

    expect(node.children.map(c => c.condition)).toEqual([['1'], ['2', '3'], null]);
    expect(node.children.every(c => c.children.length === 1)).toBe(true);
  });

  it('throws when the switch condition is missing', () => {
    const tokens: Token[] = [{ type: TokenType.SWITCH, span: { start: 0, end: 6 } }];
    expect(() => new Parser('', tokens).parse()).toThrow('Expected CONDITION after SWITCH, got EOF');
  });

  it('throws when a case has no condition', () => {
    const tokens: Token[] = [
      { type: TokenType.SWITCH, span: { start: 0, end: 6 } },
      { type: TokenType.CONDITION, parts: ['x'], span: { start: 6, end: 9 } },
      { type: TokenType.BLOCK_OPEN, span: { start: 9, end: 10 } },
      { type: TokenType.CASE, span: { start: 10, end: 14 } },
      { type: TokenType.BLOCK_OPEN, span: { start: 14, end: 15 } }
    ];
    expect(() => new Parser('', tokens).parse()).toThrow('Expected CONDITION after CASE');
  });

  it('throws when a case condition is not followed by BLOCK_OPEN', () => {
    const tokens: Token[] = [
      { type: TokenType.SWITCH, span: { start: 0, end: 6 } },
      { type: TokenType.CONDITION, parts: ['x'], span: { start: 6, end: 9 } },
      { type: TokenType.BLOCK_OPEN, span: { start: 9, end: 10 } },
      { type: TokenType.CASE, span: { start: 10, end: 14 } },
      { type: TokenType.CONDITION, parts: ['1'], span: { start: 14, end: 17 } }
    ];
    expect(() => new Parser('', tokens).parse()).toThrow('Expected BLOCK_OPEN after CASE condition');
  });

  it('throws on unexpected tokens and on EOF inside the switch instead of looping', () => {
    const head: Token[] = [
      { type: TokenType.SWITCH, span: { start: 0, end: 6 } },
      { type: TokenType.CONDITION, parts: ['x'], span: { start: 6, end: 9 } },
      { type: TokenType.BLOCK_OPEN, span: { start: 9, end: 10 } }
    ];
    const text: Token = { type: TokenType.TEXT, parts: ['a'], span: { start: 10, end: 11 } };

    expect(() => new Parser('', [...head, text]).parse()).toThrow('Unexpected TEXT inside SWITCH, expected CASE or DEFAULT');
    expect(() => new Parser('', head).parse()).toThrow('Unexpected EOF inside SWITCH, expected CASE or DEFAULT');
  });
});
