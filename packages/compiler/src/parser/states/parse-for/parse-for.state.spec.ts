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

  it('parses an iterable without item alias', () => {
    const result = parseForExpression('10; track $index');
    expect(result.itemAlias).toBeUndefined();
    expect(result.iterableSource).toBe('10');
    expect(result.trackSource).toBe('$index');
  });

  it.each(['numbers', 'numbers()', 'count() * 2'])('parses the iterable %s without item alias', source => {
    const result = parseForExpression(`${source}; track $index`);
    expect(result.itemAlias).toBeUndefined();
    expect(result.iterableSource).toBe(source);
  });

  it('parses a numeric iterable with item alias', () => {
    const result = parseForExpression('n of 5; track n');
    expect(result.itemAlias).toBe('n');
    expect(result.iterableSource).toBe('5');
  });

  it('parses implicit variable aliases', () => {
    const result = parseForExpression('item of items; track item.id; i = $index, l = $last');
    expect([...result.implicitAliases]).toEqual([['$index', 'i'], ['$last', 'l']]);
  });

  it.each([
    ['the item alias', 'item of items', 'item'],
    ['the item alias with an empty track section', 'item of items; ; i = $index', 'item'],
    ['$index without item alias', '10', '$index'],
    ['the $index alias without item alias', '10; ; i = $index', 'i']
  ])('defaults the track expression to %s', (_name, source, trackSource) => {
    const result = parseForExpression(source);
    expect(result.trackSource).toBe(trackSource);
    expect(result.trackExpression.getText()).toBe(trackSource);
  });

  it('ignores a trailing separator', () => {
    expect(parseForExpression('item of items; track item;').trackSource).toBe('item');
  });

  it('does not split on separators inside strings or brackets', () => {
    expect(parseForExpression('item of fn(";", "a;b"); track item').iterableSource).toBe('fn(";", "a;b")');
    // A `;` inside brackets is never valid JS: the whole section reaches the validation of the iterable
    expect(() => parseForExpression('item of fn([1; 2]); track item')).toThrow('\'fn([1; 2])\' must be a single expression');
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
    ['an empty expression', '  ', '@for requires at least'],
    ['a missing "of" keyword', 'item items; track item', '\'item items\' must be a single expression, got \'items\' after \'item\'.'],
    ['an iterable followed by other tokens', 'item of items items; track item', '\'items items\' must be a single expression'],
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
