import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import { ElementNode } from '../../types/nodes/element-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[];

describe('parseClassBinding', () => {
  it('parses a class toggled on an element apart from its attributes', () => {
    const [node] = parse('<div class="a" [class.is-active]="{active()}"></div>');

    expect(node.attributes.map(({ name }) => name)).toEqual(['class']);
    expect(node.classBindings).toEqual([{
      type: ASTNodeType.ClassBinding,
      className: 'is-active',
      nameSpan: { start: 15, end: 32 },
      value: expect.objectContaining({ type: ASTNodeType.Interpolation }),
      span: { start: 15, end: 45 }
    }]);
  });

  it('parses the classes toggled in the branches of a conditional binding', () => {
    const [node] = parse('<div @if (a()) { [class.on]="{b()}" } @else { [class.off]="{1}" title="x" }></div>');
    const [ifBranch, elseBranch] = node.conditionalBindings[0].branches;

    expect(node.classBindings).toEqual([]);
    expect(ifBranch.classBindings.map(({ className }) => className)).toEqual(['on']);
    expect(elseBranch.classBindings.map(({ className }) => className)).toEqual(['off']);
    expect(elseBranch.attributes.map(({ name }) => name)).toEqual(['title']);
  });

  it.each([
    ['another binding in brackets', '<div [style.color]="{c}"></div>', '"[style.color]" is not a binding'],
    ['an empty class name', '<div [class.]="{c}"></div>', '"[class.]" is not a binding'],
    ['a class name with brackets', '<div [class.a[b]]="{c}"></div>', '"[class.a[b]]" is not a binding'],
    ['an unclosed bracket', '<div [class.a="{c}"></div>', '"[class.a" is not a binding']
  ])('rejects %s', (_name, template, message) => {
    expect(() => parse(template)).toThrow(message);
  });

  it.each([
    ['a static value', '<div [class.on]="true"></div>'],
    ['no value', '<div [class.on]></div>'],
    ['no value in a conditional binding', '<div @if (a()) { [class.on] }></div>']
  ])('rejects a class toggled by %s', (_name, template) => {
    expect(() => parse(template)).toThrow('[class.on] toggles the class by the value of an expression: [class.on]="{expression}"');
  });

  it.each([
    ['in the parentheses of a directive', '<div @@tint([class.on]="{a}")></div>'],
    ['in a conditional binding of a directive', '<div @@tint(@if (a()) { [class.on]="{a}" })></div>'],
    ['in a nested conditional binding of a directive', '<div @@tint(@if (a()) { @switch (b()) { @case (1) { [class.on]="{a}" } } })></div>'],
    ['in the parentheses of a structural directive', '<div *visible([class.on]="{a}")></div>']
  ])('rejects a class toggled %s', (_name, template) => {
    expect(() => parse(template)).toThrow('[class.on] cannot be bound inside a directive: bind it on the element');
  });

  it('accepts directives binding only their properties, conditionally or not', () => {
    const [node] = parse('<div @@tint(color="red" @if (a()) { size="{b}" } @else { } @switch (c()) { @default { } }) *visible(when="{d}")></div>');

    expect(node.directives[0].attributes.map(({ name }) => name)).toEqual(['color']);
    expect(node.structuralDirectives[0].attributes.map(({ name }) => name)).toEqual(['when']);
  });
});
