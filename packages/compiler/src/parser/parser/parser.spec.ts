import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { TokenType } from '../../lexer/types/token-type.enum';
import { Token } from '../../lexer/types/token.type';
import { ASTNodeType } from '../types/node.enum';
import { Parser } from './parser';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('Parser', () => {
  it('parses every kind of top-level node', () => {
    const nodes = parse('@import { A } from \'./a\'\n<div></div>hello{value}');
    expect(nodes.map(n => n.type)).toEqual([
      ASTNodeType.Import,
      ASTNodeType.Element,
      ASTNodeType.Text,
      ASTNodeType.Interpolation
    ]);
  });

  it('assigns fallback spans to nodes without their own', () => {
    const [node] = parse('hello');
    expect(node.span).toEqual({ start: 0, end: 5 });
  });

  it('falls back to the token span when a state leaves the cursor before the first token', () => {
    const tokens: Token[] = [{ type: TokenType.TEXT, parts: ['a'], span: { start: 3, end: 4 } }];
    const parser = new Parser('abcd', tokens) as unknown as { _states: Record<number, unknown>, parseNode(): { span: unknown } };
    parser._states[TokenType.TEXT] = () => ({ type: ASTNodeType.Text, value: 'a' });

    expect(parser.parseNode().span).toEqual({ start: 3, end: 4 });
  });

  it('returns undefined from parseNode at the end of the token stream', () => {
    const parser = new Parser('', []) as unknown as { parseNode(): unknown };
    expect(parser.parseNode()).toBeUndefined();
  });

  it('throws for a token with no registered transition function', () => {
    expect(() => parse('<div></div></span>')).toThrow('No transition function for token of type TAG_CLOSE_NAME');
  });

  it('formats errors with the position and source excerpt', () => {
    expect(() => parse('hello {a = 1}')).toThrow(/^\[Parser\] \[Ln 1, Col \d+\] - /);
  });

  it('formats errors raised while the cursor is at the end of the stream', () => {
    const tokens: Token[] = [{ type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } }];
    expect(() => new Parser('<div', tokens).parse()).toThrow('[Parser]');
  });

  it('does not wrap errors more than once when parsing nested nodes', () => {
    let message = '';
    try {
      parse('<div>{a = 1}</div>');
    } catch (err) {
      message = err as string;
    }

    expect(message.match(/\[Parser\]/g)).toHaveLength(1);
  });
});
