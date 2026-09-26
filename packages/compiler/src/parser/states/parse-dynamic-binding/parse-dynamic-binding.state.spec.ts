import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { ElementNode } from '../../types/nodes/element-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[];

describe('parseDynamicBinding', () => {
  it('parses attributes, events and nested dynamic bindings', () => {
    const [node] = parse('<div @(cond(), title="x" @click="f()" @(inner(), id="y"))></div>');
    const [binding] = node.dynamicBindings;

    expect(binding.condition.getText()).toBe('cond()');
    expect(binding.attributes).toHaveLength(1);
    expect(binding.events).toHaveLength(1);
    expect(binding.dynamicBindings).toHaveLength(1);
  });

  it('throws on an unexpected token inside the binding', () => {
    const tokens: Token[] = [
      { type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } },
      { type: TokenType.DYNAMIC_BINDING, parts: ['cond()'], span: { start: 4, end: 10 } },
      { type: TokenType.TEXT, parts: ['x'], span: { start: 10, end: 11 } }
    ];
    expect(() => new Parser('', tokens).parse()).toThrow('Unexpected token in dynamic binding');
  });
});
