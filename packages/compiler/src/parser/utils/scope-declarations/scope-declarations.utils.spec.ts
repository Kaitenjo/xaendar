import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser';
import type { ElementNode } from '../../types/nodes/element-node.type';
import { isStructuralElement, visitScopeDeclarations } from './scope-declarations.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

/**
 * Returns the template variables a scope declares, with the tag name and the namespace of the element declaring them.
 */
const declarationsOf = (template: string, namespace: Parameters<typeof visitScopeDeclarations>[1] = 'html') => {
  const declarations = new Array<[name: string, tagName: string, namespace: string]>();
  visitScopeDeclarations(parse(template), namespace, {
    variable: (element, variable, elementNamespace) => declarations.push([variable.name, element.tagName, elementNamespace])
  });

  return declarations;
};

describe('visitScopeDeclarations', () => {
  it('visits the template variables of the elements of the scope, however deeply nested, in the order they are declared', () => {
    expect(declarationsOf('<form #form><label>Name <input #name /></label><button #submit /></form><p>{ name.value }</p>')).toEqual([
      ['form', 'form', 'html'],
      ['name', 'input', 'html'],
      ['submit', 'button', 'html']
    ]);
  });

  it('leaves out the declarations of the scopes opened by control-flow blocks and by elements a structural directive is applied to', () => {
    const template = [
      '@if (open()) { <input #inBranch /> }',
      '@for (item of items(); track item()) { <input #inRow /> }',
      '@switch (mode()) { @case (1) { <input #inCase /> } }',
      '<div *visible><input #inStructural /></div>',
      '<div @if (cond()) { *visible }><input #inConditionallyStructural /></div>',
      '<div @if (cond()) { title="a" }><input #inElement /></div>'
    ].join('\n');

    expect(declarationsOf(template).map(([name]) => name)).toEqual(['inElement']);
  });

  it('gives each element the namespace it is created in', () => {
    expect(declarationsOf('<svg #chart><circle #dot /><foreignObject #embed><div #box /></foreignObject></svg><math #formula><mi #symbol /></math>')).toEqual([
      ['chart', 'svg', 'svg'],
      ['dot', 'circle', 'svg'],
      ['embed', 'foreignObject', 'svg'],
      ['box', 'div', 'html'],
      ['formula', 'math', 'mathml'],
      ['symbol', 'mi', 'mathml']
    ]);
  });

  it('starts from the namespace of the scope', () => {
    expect(declarationsOf('<circle #dot />', 'svg')).toEqual([['dot', 'circle', 'svg']]);
  });

  it('visits nothing without a callback', () => {
    expect(() => visitScopeDeclarations(parse('<input #name /><template #row() />'), 'html', {})).not.toThrow();
  });

  it('visits the templates of the scope with the namespace of their content, but not the declarations of their content', () => {
    const templates = new Array<[name: string, namespace: string]>();
    const variables = new Array<string>();
    visitScopeDeclarations(parse('<template #row(item: Item)><input #inRow /><template #inner() /></template><svg><template #dot() /></svg>'), 'html', {
      variable: (_element, { name }) => variables.push(name),
      template: ({ variable: { name } }, namespace) => templates.push([name, namespace])
    });

    expect(templates).toEqual([['row', 'html'], ['dot', 'svg']]);
    expect(variables).toEqual([]);
  });

  it('visits the @let of the scope, however deeply nested, together with the other declarations in the order they are written', () => {
    const names = new Array<string>();
    const template = '@let first = 1;<div><input #name />@let second = 2;</div><template #row() />@if (open()) { @let inBranch = 3; }';
    visitScopeDeclarations(parse(template), 'html', {
      variable: (_element, { name }) => names.push(name),
      template: ({ variable: { name } }) => names.push(name),
      let: ({ name }) => names.push(name)
    });

    expect(names).toEqual(['first', 'name', 'second', 'row']);
  });
});

describe('isStructuralElement', () => {
  it.each([
    ['directly', '<div *visible></div>', true],
    ['by a conditional binding', '<div @if (cond()) { title="a" } @else { *visible }></div>', true],
    ['by a nested conditional binding', '<div @switch (mode()) { @case (1) { @if (cond()) { *visible } } }></div>', true],
    ['by no binding', '<div @if (cond()) { title="a" @@tint }></div>', false]
  ])('tells whether a structural directive is applied to an element %s', (_description, template, expected) => {
    expect(isStructuralElement(parse(template)[0] as ElementNode)).toBe(expected);
  });
});
