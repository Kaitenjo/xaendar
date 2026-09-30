import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import { ElementNode } from '../../types/nodes/element-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[];

describe('parseDirective', () => {
  it('parses a directive declared without bindings', () => {
    const [node] = parse('<div @@myDirective></div>');

    expect(node.directives).toEqual([{
      type: ASTNodeType.Directive,
      selector: 'myDirective',
      attributes: [],
      events: [],
      conditionalBindings: [],
      span: { start: 7, end: 18 }
    }]);
  });

  it('parses the attributes and the events of a directive', () => {
    const [node] = parse('<div @@myDirective(display="block" visible="{visible()}" disabled @change="onChange($event)")></div>');
    const [directive] = node.directives;

    expect(directive.selector).toBe('myDirective');
    expect(directive.attributes.map(({ name }) => name)).toEqual(['display', 'visible', 'disabled']);
    expect(directive.attributes[0].value).toBe('block');
    expect(directive.attributes[2].value).toBe('true');
    expect(directive.events.map(({ name, handler }) => [name, handler])).toEqual([['change', 'onChange']]);
    expect(directive.span).toEqual({ start: 7, end: 93 });
  });

  it('keeps the directive bindings apart from the element ones', () => {
    const [node] = parse('<div class="a" @@myDirective(display="block") @click="onClick()"></div>');

    expect(node.attributes.map(({ name }) => name)).toEqual(['class']);
    expect(node.events.map(({ name }) => name)).toEqual(['click']);
    expect(node.directives[0].attributes.map(({ name }) => name)).toEqual(['display']);
  });

  it('parses the conditional bindings of a directive', () => {
    const [node] = parse('<div @@myDirective(display="block" @(cond(), position="top" @change="onChange()" @(inner(), label="x")))></div>');
    const [directive] = node.directives;
    const [binding] = directive.conditionalBindings;

    expect(node.conditionalBindings).toEqual([]);
    expect(directive.attributes.map(({ name }) => name)).toEqual(['display']);
    expect(binding.condition.getText()).toBe('cond()');
    expect(binding.attributes.map(({ name }) => name)).toEqual(['position']);
    expect(binding.events.map(({ name }) => name)).toEqual(['change']);
    expect(binding.directives).toEqual([]);
    expect(binding.conditionalBindings[0].attributes.map(({ name }) => name)).toEqual(['label']);
  });

  it('throws on an unexpected token inside the directive', () => {
    const tokens: Token[] = [
      { type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } },
      { type: TokenType.DIRECTIVE, parts: ['myDirective'], span: { start: 5, end: 19 } },
      { type: TokenType.TEXT, parts: ['x'], span: { start: 19, end: 20 } }
    ];
    expect(() => new Parser('', tokens).parse()).toThrow('Unexpected token in directive');
  });
});
