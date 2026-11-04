import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { ClientNode } from '../../../parser/types/nodes/client-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckClient } from './type-check-client.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ClientNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];

describe('typeCheckClient', () => {
  it('checks the content in a scope of its own', () => {
    const lines = typeCheckClient(parse('@client { <a></a> }'), processNode, new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual([
      '{',
      '  child;',
      '}'
    ]);
  });

  it('checks the placeholder too, each one declaring its element refs in its own scope', () => {
    const lines = typeCheckClient(parse('@client { <input #field /> } @placeholder { <input #field /> }'), processNode, new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual([
      '{',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '}',
      '{',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '}'
    ]);
  });
});
