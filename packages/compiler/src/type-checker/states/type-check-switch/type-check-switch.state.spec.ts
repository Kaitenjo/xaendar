import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { SwitchNode } from '../../../parser/types/nodes/switch-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckSwitch } from './type-check-switch.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as SwitchNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];

describe('typeCheckSwitch', () => {
  it('emits a switch with stacked cases and a default', () => {
    const template = '@switch (x) { @case (1) { <a></a> } @case (2) @case (3) { <b></b> } @default { <c></c> } }';
    const lines = typeCheckSwitch(parse(template), processNode, new TypeCheckContext());

    expect(lines.map(l => l.text)).toEqual([
      'switch (root.x) {',
      '  case 1:',
      '    child;',
      '    break;',
      '  case 2:',
      '  case 3:',
      '    child;',
      '    break;',
      '  default:',
      '    child;',
      '    break;',
      '}'
    ]);
    expect(lines[0].mappings).toHaveLength(1);
  });
});
