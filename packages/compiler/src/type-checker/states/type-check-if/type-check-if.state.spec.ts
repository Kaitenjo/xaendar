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

  it('declares the element refs of each branch at its start, in a scope of its own, so that two branches can declare the same name', () => {
    expect(run('@if (a) { <input #field /> } @else if (b) { <p #text></p> } @else { <select #field /> }')).toEqual([
      'if (root.a) {',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '}',
      'else if (root.b) {',
      '  let text!: (HTMLElementTagNameMap extends { \'p\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '}',
      'else {',
      '  let field!: (HTMLElementTagNameMap extends { \'select\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '}'
    ]);
  });

  it('reads the signals the conditions call through constants declared before the chain, in its conditions and in its branches', () => {
    const context = new TypeCheckContext();
    context.addSignalClassField('user');
    context.addSignalClassField('count');
    // The children read the signals as the nodes of the branches do
    const readSignals: ProcessNode = (_node, branchContext) => [{ text: `${branchContext.getNarrowedSignal('user')} ${branchContext.getNarrowedSignal('count')};` }];

    expect(typeCheckIf(parse('@if (user()) { <b></b> } @else if (count() > 1) { <i></i> } @else { <u></u> }'), readSignals, context).map(l => l.text)).toEqual([
      'const __if0_user = root.user();',
      'const __if0_count = root.count();',
      'if ((root.user(), __if0_user)) {',
      '  __if0_user __if0_count;',
      '}',
      'else if ((root.count(), __if0_count) > 1) {',
      '  __if0_user __if0_count;',
      '}',
      'else {',
      '  __if0_user __if0_count;',
      '}'
    ]);
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
