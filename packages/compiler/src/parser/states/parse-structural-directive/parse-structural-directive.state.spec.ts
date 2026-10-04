import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import { ElementNode } from '../../types/nodes/element-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[];

describe('parseStructuralDirective', () => {
  it('parses a structural directive declared without bindings', () => {
    const [node] = parse('<div *hasRole></div>');

    expect(node.structuralDirectives).toEqual([{
      type: ASTNodeType.StructuralDirective,
      selector: 'hasRole',
      attributes: [],
      span: { start: 6, end: 13 }
    }]);
  });

  it('parses the properties of a structural directive', () => {
    const [node] = parse('<div *hasRole(role="admin" level="{level()}" strict)></div>');
    const [structuralDirective] = node.structuralDirectives;

    expect(structuralDirective.selector).toBe('hasRole');
    expect(structuralDirective.attributes.map(({ name }) => name)).toEqual(['role', 'level', 'strict']);
    expect(structuralDirective.attributes[0].value).toBe('admin');
    expect(structuralDirective.attributes[2].value).toBe('true');
    expect(structuralDirective.span).toEqual({ start: 6, end: 52 });
  });

  it('keeps the structural directive properties apart from the element attributes', () => {
    const [node] = parse('<div class="a" *hasRole(role="admin") (click)="onClick()"></div>');

    expect(node.attributes.map(({ name }) => name)).toEqual(['class']);
    expect(node.events.map(({ name }) => name)).toEqual(['click']);
    expect(node.structuralDirectives[0].attributes.map(({ name }) => name)).toEqual(['role']);
  });

  it('throws on an unexpected token inside the structural directive', () => {
    const tokens: Token[] = [
      { type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } },
      { type: TokenType.STRUCTURAL_DIRECTIVE, parts: ['hasRole'], span: { start: 5, end: 13 } },
      { type: TokenType.EVENT, parts: ['change'], span: { start: 13, end: 21 } }
    ];
    expect(() => new Parser('', tokens).parse()).toThrow('Unexpected token in structural directive');
  });
});
