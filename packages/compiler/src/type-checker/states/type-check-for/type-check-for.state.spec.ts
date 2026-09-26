import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckFor } from './type-check-for.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ForNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];

describe('typeCheckFor', () => {
  it('emits a for...of loop declaring the implicit variables', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item.id) { <li></li> }'), processNode, new TypeCheckContext());

    expect(lines.map(l => l.text)).toEqual([
      'for (const item of root.items) {',
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

  it('uses the aliases declared for implicit variables', () => {
    const lines = typeCheckFor(parse('@for (item of items; track item; i = $index) { <li></li> }'), processNode, new TypeCheckContext());
    expect(lines[1].text).toBe('  let i!: Signal<number>;');
  });
});
