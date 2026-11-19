import { describe, expect, it } from 'vitest';
import type { ContextCache } from '../../../types/context-cache.type';
import { GeneratorContext } from '../../context/context';
import { declareExpression, toArrayLiteral, toObjectLiteral, toRoleName } from './module-code.utils';

const cache = {} as ContextCache;

describe('toObjectLiteral', () => {
  it('writes an empty object', () => {
    expect(toObjectLiteral([])).toBe('{}');
  });

  it('writes a short object on one line, with a space inside its braces', () => {
    expect(toObjectLiteral(['tagName: \'td\'', 'children: td0Children'])).toBe('{ tagName: \'td\', children: td0Children }');
  });

  it('writes an object of exactly the widest inline width on one line', () => {
    // 4 characters of braces and spaces, the member 96
    const member = `name: '${'a'.repeat(88)}'`;

    expect(toObjectLiteral([member])).toBe(`{ ${member} }`);
    expect(toObjectLiteral([member])).toHaveLength(100);
  });

  it('writes an object wider than the inline width with a member per line, a comma after every member but the last', () => {
    const first = `first: '${'a'.repeat(50)}'`;
    const second = `second: '${'b'.repeat(50)}'`;

    expect(toObjectLiteral([first, second])).toBe(`{\n  ${first},\n  ${second}\n}`);
  });

  it('writes an object holding a value written on several lines with a member per line, indenting the lines of the value with it', () => {
    const nested = toObjectLiteral([`first: '${'a'.repeat(50)}'`, `second: '${'b'.repeat(50)}'`]);

    expect(toObjectLiteral(['tagName: \'div\'', `attributes: ${nested}`])).toBe([
      '{',
      '  tagName: \'div\',',
      '  attributes: {',
      `    first: '${'a'.repeat(50)}',`,
      `    second: '${'b'.repeat(50)}'`,
      '  }',
      '}'
    ].join('\n'));
  });
});

describe('toArrayLiteral', () => {
  it('writes an empty array', () => {
    expect(toArrayLiteral([])).toBe('[]');
  });

  it('writes a short array on one line, without spaces inside its brackets', () => {
    expect(toArrayLiteral(['\'a\'', '\'b\''])).toBe('[\'a\', \'b\']');
  });

  it('writes an array wider than the inline width with an item per line', () => {
    const first = `'${'a'.repeat(60)}'`;
    const second = `'${'b'.repeat(60)}'`;

    expect(toArrayLiteral([first, second])).toBe(`[\n  ${first},\n  ${second}\n]`);
  });

  it('writes an array holding an item written on several lines with an item per line, indenting the lines of the item with it', () => {
    const nested = toObjectLiteral([`first: '${'a'.repeat(50)}'`, `second: '${'b'.repeat(50)}'`]);

    expect(toArrayLiteral([nested, '{ block: else0 }'])).toBe([
      '[',
      '  {',
      `    first: '${'a'.repeat(50)}',`,
      `    second: '${'b'.repeat(50)}'`,
      '  },',
      '  { block: else0 }',
      ']'
    ].join('\n'));
  });
});

describe('declareExpression', () => {
  it('declares in the module a function receiving the context and returning the expression', () => {
    const context = new GeneratorContext(cache);

    expect(declareExpression(context, 'td0$title', 'this.title')).toBe('td0$title');
    expect(context.functionDeclarations).toEqual(['function td0$title(context) {\n  return this.title;\n}']);
  });

  it('declares the function with the parameters it is given', () => {
    const context = new GeneratorContext(cache);

    expect(declareExpression(context, 'for0$track', 'row.id', 'context, row, $index')).toBe('for0$track');
    expect(context.functionDeclarations).toEqual(['function for0$track(context, row, $index) {\n  return row.id;\n}']);
  });

  it('returns the name the function is declared with, a number appended when the name is taken', () => {
    const context = new GeneratorContext(cache);
    declareExpression(context, 'div0$if', 'this.a');

    expect(declareExpression(context, 'div0$if', 'this.b')).toBe('div0$if1');
  });
});

describe('toRoleName', () => {
  it('keeps the characters an identifier can hold', () => {
    expect(toRoleName('title_$1')).toBe('title_$1');
  });

  it('turns the characters an identifier cannot hold into underscores', () => {
    expect(toRoleName('aria-hidden')).toBe('aria_hidden');
    expect(toRoleName('is-on.big:x')).toBe('is_on_big_x');
  });
});
