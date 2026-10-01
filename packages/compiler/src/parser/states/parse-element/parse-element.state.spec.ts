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

  it('parses attributes, events and conditional bindings', () => {
    const [node] = parse('<div class="a" (click)="f()" @if (cond()) { title="x" } @switch (mode()) { @case (1) { id="y" } }></div>') as ElementNode[];
    expect(node.attributes).toHaveLength(1);
    expect(node.events).toHaveLength(1);
    expect(node.conditionalBindings.map(({ type }) => type)).toEqual([ASTNodeType.IfBinding, ASTNodeType.SwitchBinding]);
  });

  it('parses the conditional bindings of a self-closing element', () => {
    const [node] = parse('<input @if (cond()) { disabled } />') as ElementNode[];
    expect(node.conditionalBindings).toHaveLength(1);
    expect(node.children).toEqual([]);
  });

  it('parses directives', () => {
    const [node] = parse('<div @@first @@second(display="block")></div>') as ElementNode[];
    expect(node.directives.map(({ selector }) => selector)).toEqual(['first', 'second']);
  });

  it('parses the directives of a self-closing element', () => {
    const [node] = parse('<input @@myDirective />') as ElementNode[];
    expect(node.directives).toHaveLength(1);
  });

  it('throws when a directive is applied more than once', () => {
    expect(() => parse('<div @@myDirective @@myDirective(display="block")></div>')).toThrow('Directive "myDirective" is applied more than once on <div>');
  });

  it('throws when a directive property is bound more than once', () => {
    expect(() => parse('<div @@myDirective(display="block" display="{none()}")></div>')).toThrow('Property "display" of directive "myDirective" is bound more than once on <div>');
  });

  it.each([
    ['on the element and inside a conditional binding', '<div @@myDirective @if (cond()) { @@myDirective }></div>'],
    ['inside a conditional binding and on the element after it', '<div @if (cond()) { @@myDirective } @@myDirective></div>'],
    ['inside two conditional bindings', '<div @if (first()) { @@myDirective } @if (second()) { @@myDirective }></div>'],
    ['inside a nested conditional binding', '<div @if (first()) { @@myDirective @if (second()) { @@myDirective } }></div>'],
    ['in a branch of a switch and inside another conditional binding', '<div @switch (mode()) { @case (1) { @@other } @default { @@myDirective } } @if (cond()) { @@myDirective }></div>']
  ])('throws when a directive is applied more than once %s', (_description, template) => {
    expect(() => parse(template)).toThrow('Directive "myDirective" is applied more than once on <div>');
  });

  it.each([
    ['in the directive and inside one of its conditional bindings', '<div @@myDirective(display="block" @if (cond()) { display="none" })></div>'],
    ['inside two conditional bindings of the directive', '<div @@myDirective(@if (first()) { display="block" } @if (second()) { display="none" })></div>'],
    ['in a directive applied inside a conditional binding', '<div @if (cond()) { @@myDirective(display="block" display="none") }></div>']
  ])('throws when a directive property is bound more than once %s', (_description, template) => {
    expect(() => parse(template)).toThrow('Property "display" of directive "myDirective" is bound more than once on <div>');
  });

  it('allows a directive property to share its name with an element attribute or another directive property', () => {
    const [node] = parse('<div title="a" @@first(title="b") @@second(title="c")></div>') as ElementNode[];
    expect(node.directives).toHaveLength(2);
  });

  it('allows the same event to be bound more than once', () => {
    const [node] = parse('<div (click)="f()" (click)="g()" @if (cond()) { (click)="h()" }></div>') as ElementNode[];
    expect(node.events).toHaveLength(2);
  });

  it.each([
    ['on the element', '<div title="a" title="{b}"></div>'],
    ['on the element and in a conditional binding', '<div title="a" @if (cond()) { title="b" }></div>'],
    ['in a conditional binding and on the element after it', '<div @if (cond()) { title="b" } title="a"></div>'],
    ['on the element and in the last branch of a conditional binding', '<div title="a" @if (cond()) { id="b" } @else if (other()) { id="c" } @else { title="d" }></div>'],
    ['in two conditional bindings', '<div @if (cond()) { title="a" } @if (other()) { title="b" }></div>'],
    ['in a branch of a switch and in a following conditional binding', '<div @switch (mode()) { @case (1) { title="a" } @default { id="b" } } @if (cond()) { title="c" }></div>'],
    ['in a nested conditional binding', '<div @if (cond()) { title="a" @if (other()) { title="b" } }></div>'],
    ['in a branch and in the branches of a conditional binding nested in it', '<div @if (cond()) { @if (other()) { title="a" } @else { title="b" } title="c" }></div>'],
    ['twice in the same branch', '<div @if (cond()) { id="a" } @else { title="b" title="c" }></div>']
  ])('throws when an attribute is bound more than once %s', (_description, template) => {
    expect(() => parse(template)).toThrow('Attribute "title" is bound more than once on <div>');
  });

  it.each([
    ['an @if chain', '<div @if (a()) { title="x" } @else if (b()) { title="y" } @else { title="z" }></div>'],
    ['a @switch', '<div @switch (mode()) { @case (1) { title="x" } @case (2) { title="y" } @default { title="z" } }></div>'],
    ['nested conditional bindings', '<div @if (a()) { @if (b()) { title="x" } @else { title="y" } } @else { title="z" }></div>']
  ])('allows an attribute to be bound in every branch of %s, since only one of them is applied at a time', (_description, template) => {
    expect(() => parse(template)).not.toThrow();
  });

  it('allows a directive to be applied, and its properties to be bound, in every branch of a conditional binding', () => {
    expect(() => parse('<div @if (a()) { @@myDirective(display="block") } @else { @@myDirective(display="none") }></div>')).not.toThrow();
    expect(() => parse('<div @@myDirective(@switch (mode()) { @case (1) { display="block" } @default { display="none" } })></div>')).not.toThrow();
  });

  it('throws on a flow-control keyword not belonging to a conditional binding', () => {
    expect(() => parse('<div @else { title="x" }></div>')).toThrow('Unexpected token ELSE');
    expect(() => parse('<div @if (cond()) { title="x" } id="y" @else { title="z" }></div>')).toThrow('Unexpected token ELSE');
    expect(() => parse('<div hidden @case (1) { title="x" }></div>')).toThrow('Unexpected token CASE');
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
