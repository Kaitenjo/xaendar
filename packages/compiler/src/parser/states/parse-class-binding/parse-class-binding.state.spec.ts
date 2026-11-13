import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import { ElementNode } from '../../types/nodes/element-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse() as ElementNode[];

describe('parseBracketBinding', () => {
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
    ['another binding in brackets', '<div [attr.color]="{c}"></div>', '"[attr.color]" is not a binding: a class is toggled with [class.name]="{expression}", a style property is set with [style.name]="{expression}"'],
    ['an empty style property', '<div [style.]="{c}"></div>', '"[style.]" is not a binding'],
    ['an empty class name', '<div [class.]="{c}"></div>', '"[class.]" is not a binding'],
    ['a class name with brackets', '<div [class.a[b]]="{c}"></div>', '"[class.a[b]]" is not a binding'],
    ['an unclosed bracket', '<div [class.a="{c}"></div>', '"[class.a" is not a binding']
  ])('rejects %s', (_name, template, message) => {
    expect(() => parse(template)).toThrow(message);
  });

  it('parses the style properties set on an element, in kebab-case or camelCase, with their unit, and the custom properties', () => {
    const [node] = parse('<div [style.color]="{c()}" [style.backgroundColor]="{b}" [style.width.px]="{w}" [style.height.%]="{h}" [style.--accent]="{a}" @if (x) { [style.top.em]="{t}" }></div>');

    expect(node.styleBindings.map(({ property, unit }) => [property, unit])).toEqual([['color', undefined], ['background-color', undefined], ['width', 'px'], ['height', '%'], ['--accent', undefined]]);
    expect(node.styleBindings[0]).toMatchObject({ type: ASTNodeType.StyleBinding, nameSpan: { start: 5, end: 18 } });
    expect(node.conditionalBindings[0].branches[0].styleBindings.map(({ property, unit }) => [property, unit])).toEqual([['top', 'em']]);
    expect(node.classBindings).toEqual([]);
  });

  it.each([
    ['a name with digits', '<div [style.1x]="{c}"></div>'],
    ['a unit in uppercase', '<div [style.width.PX]="{c}"></div>'],
    ['more than one unit', '<div [style.width.px.em]="{c}"></div>']
  ])('rejects a style property named by %s', (_name, template) => {
    expect(() => parse(template)).toThrow('does not name a style property: write it in kebab-case or in camelCase, followed by its unit if any, e.g. [style.width.px], or a custom property, e.g. [style.--accent]');
  });

  it('rejects a unit CSS does not have', () => {
    expect(() => parse('<div [style.width.foo]="{c}"></div>')).toThrow('[style.width.foo] sets width in "foo", which is not a unit of CSS: write one of them, e.g. px, rem, %, vh');
  });

  it('rejects a style property set by a static value', () => {
    expect(() => parse('<div [style.color]="red"></div>')).toThrow('[style.color] sets the style property by the value of an expression: [style.color]="{expression}"');
  });

  it.each([
    ['in a conditional binding of a directive', '<div @@tint(@if (a()) { [style.color]="{a}" })></div>'],
    ['in the parentheses of a directive', '<div @@tint([style.color]="{a}")></div>']
  ])('rejects a style property set %s', (_name, template) => {
    expect(() => parse(template)).toThrow('[style.color] cannot be bound inside a directive: bind it on the element');
  });

  it.each([
    ['twice on the element', '<div [style.width.px]="{a}" [style.width.%]="{b}"></div>'],
    ['on the element and in a conditional binding', '<div [style.color]="{a}" @if (x) { [style.color]="{b}" }></div>']
  ])('rejects a style property set %s', (_name, template) => {
    expect(() => parse(template)).toThrow(/Style property "(width|color)" is bound more than once on <div>/);
  });

  it('accepts the branches of a conditional binding setting the same style property', () => {
    expect(() => parse('<div @if (x) { [style.color]="{a}" } @else { [style.color]="{b}" }></div>')).not.toThrow();
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
