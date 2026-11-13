import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { TypeCheckContext } from '../../models/context/context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckFor } from './type-check-for.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ForNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];
const FOR_ITERABLE = '(<T extends number | Iterable<unknown>>(iterable: T & (T extends string ? never : unknown)): T extends number ? number[] : T => iterable as never)';

describe('typeCheckFor', () => {
  it('emits a for...of loop declaring the item and the implicit variables as the values they are', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item.id) { <li></li> }'), processNode, new TypeCheckContext());

    expect(lines.map(l => l.text)).toEqual([
      `for (const $$item of ${FOR_ITERABLE}(root.items)) {`,
      '  let item!: typeof $$item;',
      '  let $index!: number;',
      '  let $first!: boolean;',
      '  let $last!: boolean;',
      '  let $even!: boolean;',
      '  let $odd!: boolean;',
      '  let $count!: number;',
      '  item.id;',
      '  child;',
      '}'
    ]);
    expect(lines[0].mappings![0]).toBeDefined();
  });

  it('declares the element refs of the body after the variables of the loop, before the track expression', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item.id) { <li><input #field /></li> }'), processNode, new TypeCheckContext());

    expect(lines.map(l => l.text).slice(6, 10)).toEqual([
      '  let $odd!: boolean;',
      '  let $count!: number;',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  item.id;'
    ]);
  });

  it.each([
    ['10', '10'],
    ['numbers', 'root.numbers'],
    ['numbers()', 'root.numbers()']
  ])('declares no item when no item alias is given, iterating %s', (iterable, expected) => {
    const lines = typeCheckFor(parse(`@for (${iterable}; track $index) { <li></li> }`), processNode, new TypeCheckContext());
    expect(lines[0].text).toBe(`for (const $$item of ${FOR_ITERABLE}(${expected})) {`);
    expect(lines[1].text).toBe('  let $index!: number;');
    expect(lines[7].text).toBe('  $index;');
  });

  it('does not prefix the identifiers declared in scope', () => {
    const context = new TypeCheckContext();
    context.addUnresolvableIdentifier('item');
    const lines = typeCheckFor(parse('@for (child of item.children; track child) { <li></li> }'), processNode, context);
    expect(lines[0].text).toBe(`for (const $$item of ${FOR_ITERABLE}(item.children)) {`);
  });

  it('reads the members of the component in the track expression from root', () => {
    const lines = typeCheckFor(parse('@for (item of items; track keyOf(item)) { <li></li> }'), processNode, new TypeCheckContext());
    expect(lines[8].text).toBe('  root.keyOf(item);');
  });

  it('checks the content of the @empty in a block of its own after the loop, in the enclosing scope', () => {
    const contexts = new Array<TypeCheckContext>();
    const record: ProcessNode = (_child, context) => {
      contexts.push(context);
      return [{ text: 'child;' }];
    };
    const outer = new TypeCheckContext();
    const lines = typeCheckFor(parse('@for (item of items; track item) { <li></li> } @empty { <p></p> }'), record, outer);

    expect(lines.slice(-3).map(l => l.text)).toEqual(['{', '  child;', '}']);
    expect(contexts[0].hasUnresolvableIdentifier('item')).toBe(true);
    expect(contexts[1].hasUnresolvableIdentifier('item')).toBe(false);
  });

  it('uses the aliases declared for implicit variables', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item; i = $index) { <li></li> }'), processNode, new TypeCheckContext());
    expect(lines[2].text).toBe('  let i!: number;');
  });

  it('maps the declarations of the item and of the aliases onto the template, and the expressions finely', () => {
    const template = '@for (item of items; track item; i = $index) { <li></li> }';
    const lines = typeCheckFor(parse(template), processNode, new TypeCheckContext());
    const at = (text: string) => ({ start: template.indexOf(text), end: template.indexOf(text) + text.length });

    // `items` in `root.items`
    expect(lines[0].mappings).toContainEqual({ columnStart: lines[0].text.indexOf('items'), columnEnd: lines[0].text.indexOf('items') + 5, original: at('items') });
    expect(lines[1].mappings).toEqual([{ columnStart: 6, columnEnd: 10, original: at('item') }]);
    expect(lines[2].mappings).toEqual([{ columnStart: 6, columnEnd: 7, original: { start: template.indexOf('i ='), end: template.indexOf('i =') + 1 } }]);
    expect(lines[3].mappings).toBeUndefined();
    const track = template.indexOf('track item') + 'track '.length;
    expect(lines[8].mappings).toContainEqual({ columnStart: 2, columnEnd: 6, original: { start: track, end: track + 4 } });
  });
});
