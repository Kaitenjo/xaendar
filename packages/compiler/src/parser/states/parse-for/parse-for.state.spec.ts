import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import { ForNode } from '../../types/nodes/for-node.type';
import { parseForExpression } from './parse-for.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseForControlFlow', () => {
  it('parses a for block with children', () => {
    const [node] = parse('@for (item of items; track item.id) { <li></li> }') as ForNode[];
    expect(node.type).toBe(ASTNodeType.For);
    expect(node.itemAlias).toBe('item');
    expect(node.children).toHaveLength(1);
  });

  it('throws when the condition is missing', () => {
    const tokens: Token[] = [{ type: TokenType.FOR, span: { start: 0, end: 3 } }];
    expect(() => new Parser('', tokens).parse()).toThrow('Expected CONDITION after FOR, got EOF');
  });
});

describe('parseForExpression', () => {
  it('parses item, iterable and track expressions', () => {
    const result = parseForExpression('item of items; track item.id');
    expect(result.itemAlias).toBe('item');
    expect(result.iterableSource).toBe('items');
    expect(result.trackSource).toBe('item.id');
    expect(result.implicitAliases.size).toBe(0);
  });

  it('parses implicit variable aliases', () => {
    const result = parseForExpression('item of items; track item.id; i = $index, l = $last');
    expect([...result.implicitAliases]).toEqual([['$index', 'i'], ['$last', 'l']]);
  });

  it('ignores a trailing separator', () => {
    expect(parseForExpression('item of items; track item;').trackSource).toBe('item');
  });

  it('does not split on separators inside strings or brackets', () => {
    const result = parseForExpression('item of fn([1; 2], "a;b"); track item');
    expect(result.iterableSource).toBe('fn([1; 2], "a;b")');
  });

  it('handles escaped quotes inside strings', () => {
    const result = parseForExpression(String.raw`item of ['a\';b']; track item`);
    expect(result.iterableSource).toBe(String.raw`['a\';b']`);
  });

  it('handles braces and closing brackets', () => {
    const result = parseForExpression('item of {a: 1}.list; track item');
    expect(result.iterableSource).toBe('{a: 1}.list');
  });

  it.each([
    ['fewer than two sections', 'item of items', '@for requires at least'],
    ['a missing "of" keyword', 'item items; track item', 'must be in the form "item of iterable"'],
    ['an invalid item alias', '1x of items; track x', '\'1x\' is not a valid item alias.'],
    ['an alias that is not an identifier', '// of items; track x', 'is not a valid item alias'],
    ['a second section without track', 'item of items; foo', 'must start with "track"'],
    ['an alias declaration without "="', 'item of items; track item; $index', 'Invalid alias declaration'],
    ['an unknown implicit variable', 'item of items; track item; f = $foo', 'is not a known implicit variable'],
    ['an empty alias identifier', 'item of items; track item; = $index', 'is not a valid alias identifier'],
    ['an invalid alias identifier', 'item of items; track item; 1a = $index', 'is not a valid alias identifier'],
    ['a duplicated implicit alias', 'item of items; track item; a = $index, b = $index', 'is already aliased']
  ])('throws for %s', (_name, source, message) => {
    expect(() => parseForExpression(source)).toThrow(message);
  });
});
