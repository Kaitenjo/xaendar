import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { IfNode } from '../../../parser/types/nodes/if-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckIf } from './type-check-if.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as IfNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];
const run = (template: string) => typeCheckIf(parse(template), processNode, new TypeCheckContext()).map(l => l.text);

describe('typeCheckIf', () => {
  it('emits a single if block', () => {
    expect(run('@if (a) { <b></b> }')).toEqual(['if (root.a) {', '  child;', '}']);
  });

  it('emits else if and else blocks', () => {
    expect(run('@if (a) { <b></b> } @else if (b) { <i></i> } @else { <u></u> }')).toEqual([
      'if (root.a) {',
      '  child;',
      '}',
      'else if (root.b) {',
      '  child;',
      '}',
      'else {',
      '  child;',
      '}'
    ]);
  });
});
