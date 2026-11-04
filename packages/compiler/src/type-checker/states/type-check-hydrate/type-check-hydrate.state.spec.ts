import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckHydrate } from './type-check-hydrate.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as HydrateNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];

describe('typeCheckHydrate', () => {
  it('reads the expression of when as a condition, then checks the content in a scope of its own', () => {
    const lines = typeCheckHydrate(parse('@hydrate (idle, when ready()) { <a></a> }'), processNode, new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual([
      'if (root.ready()) { }',
      '{',
      '  child;',
      '}'
    ]);
    expect(lines[0].mappings![0]).toBeDefined();
  });

  it('declares the element refs of the content in its own scope', () => {
    const lines = typeCheckHydrate(parse('@hydrate (load) { <input #field /> }'), processNode, new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual([
      '{',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '}'
    ]);
  });
});
