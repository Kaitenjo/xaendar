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
  it('emits a for...of loop declaring the implicit variables', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item.id) { <li></li> }'), processNode, new TypeCheckContext());

    expect(lines.map(l => l.text)).toEqual([
      `for (const item of ${FOR_ITERABLE}(root.items)) {`,
      '  let $index!: Signal<number>;',
      '  let $first!: Signal<boolean>;',
      '  let $last!: Signal<boolean>;',
      '  let $even!: Signal<boolean>;',
      '  let $odd!: Signal<boolean>;',
      '  item.id;',
      '  child;',
      '}'
    ]);
    expect(lines[0].mappings).toHaveLength(1);
  });

  it.each([
    ['10', '10'],
    ['numbers', 'root.numbers'],
    ['numbers()', 'root.numbers()']
  ])('declares a placeholder loop variable when no item alias is given, iterating %s', (iterable, expected) => {
    const lines = typeCheckFor(parse(`@for (${iterable}; track $index) { <li></li> }`), processNode, new TypeCheckContext());
    expect(lines[0].text).toBe(`for (const _ of ${FOR_ITERABLE}(${expected})) {`);
    expect(lines[6].text).toBe('  $index;');
  });

  it('does not prefix the identifiers declared in scope', () => {
    const context = new TypeCheckContext();
    context.addUnresolvableIdentifier('item');
    const lines = typeCheckFor(parse('@for (child of item.children; track child) { <li></li> }'), processNode, context);
    expect(lines[0].text).toBe(`for (const child of ${FOR_ITERABLE}(item.children)) {`);
  });

  it('uses the aliases declared for implicit variables', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item; i = $index) { <li></li> }'), processNode, new TypeCheckContext());
    expect(lines[1].text).toBe('  let i!: Signal<number>;');
  });
});
