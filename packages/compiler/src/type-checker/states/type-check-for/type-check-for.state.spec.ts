import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckFor } from './type-check-for.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ForNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];
const FOR_ITERABLE = '(<T extends number | readonly unknown[]>(iterable: T): T extends number ? number[] : T => iterable as never)';

describe('typeCheckFor', () => {
  it('emits a for...of loop declaring the item and the implicit variables as signals', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item().id) { <li></li> }'), processNode, new TypeCheckContext());

    expect(lines.map(l => l.text)).toEqual([
      `for (const $$item of ${FOR_ITERABLE}(root.items)) {`,
      '  let item!: Signal<typeof $$item>;',
      '  let $index!: Signal<number>;',
      '  let $first!: Signal<boolean>;',
      '  let $last!: Signal<boolean>;',
      '  let $even!: Signal<boolean>;',
      '  let $odd!: Signal<boolean>;',
      '  item().id;',
      '  child;',
      '}'
    ]);
    expect(lines[0].mappings![0]).toBeDefined();
  });

  it('declares the template variables of the body after the variables of the loop, before the track expression', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item().id) { <li><input #field /></li> }'), processNode, new TypeCheckContext());

    expect(lines.map(l => l.text).slice(6, 9)).toEqual([
      '  let $odd!: Signal<boolean>;',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  item().id;'
    ]);
  });

  it.each([
    ['10', '10'],
    ['numbers', 'root.numbers'],
    ['numbers()', 'root.numbers()']
  ])('declares no item when no item alias is given, iterating %s', (iterable, expected) => {
    const lines = typeCheckFor(parse(`@for (${iterable}; track $index()) { <li></li> }`), processNode, new TypeCheckContext());
    expect(lines[0].text).toBe(`for (const $$item of ${FOR_ITERABLE}(${expected})) {`);
    expect(lines[1].text).toBe('  let $index!: Signal<number>;');
    expect(lines[6].text).toBe('  $index();');
  });

  it('does not prefix the identifiers declared in scope', () => {
    const context = new TypeCheckContext();
    context.addUnresolvableIdentifier('item');
    const lines = typeCheckFor(parse('@for (child of item.children; track child()) { <li></li> }'), processNode, context);
    expect(lines[0].text).toBe(`for (const $$item of ${FOR_ITERABLE}(item.children)) {`);
  });

  it('reads the members of the component in the track expression from root', () => {
    const lines = typeCheckFor(parse('@for (item of items; track keyOf(item())) { <li></li> }'), processNode, new TypeCheckContext());
    expect(lines[7].text).toBe('  root.keyOf(item());');
  });

  it('uses the aliases declared for implicit variables', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item(); i = $index) { <li></li> }'), processNode, new TypeCheckContext());
    expect(lines[2].text).toBe('  let i!: Signal<number>;');
  });

  it('maps the declarations of the item and of the aliases onto the template, and the expressions finely', () => {
    const template = '@for (item of items; track item(); i = $index) { <li></li> }';
    const lines = typeCheckFor(parse(template), processNode, new TypeCheckContext());
    const at = (text: string) => ({ start: template.indexOf(text), end: template.indexOf(text) + text.length });

    // `items` in `root.items`
    expect(lines[0].mappings).toContainEqual({ columnStart: lines[0].text.indexOf('items'), columnEnd: lines[0].text.indexOf('items') + 5, original: at('items') });
    expect(lines[1].mappings).toEqual([{ columnStart: 6, columnEnd: 10, original: at('item') }]);
    expect(lines[2].mappings).toEqual([{ columnStart: 6, columnEnd: 7, original: { start: template.indexOf('i ='), end: template.indexOf('i =') + 1 } }]);
    expect(lines[3].mappings).toBeUndefined();
    expect(lines[7].mappings).toContainEqual({ columnStart: 2, columnEnd: 6, original: { start: template.indexOf('item()'), end: template.indexOf('item()') + 4 } });
  });
});
