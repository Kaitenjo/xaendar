import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { SwitchNode } from '../../../parser/types/nodes/switch-node.type';
import { TypeCheckContext } from '../../models/context/context';
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
    expect(lines[0].mappings![0]).toBeDefined();
  });

  it('keeps the value of an exhaustive switch in a constant, whose default must be never, mapped onto @default never; and recorded', () => {
    const template = '@switch (mode()) { @case (\'idle\') { <a></a> } @default never; }';
    const context = new TypeCheckContext();
    const lines = typeCheckSwitch(parse(template), processNode, context);
    const exhaustive = { start: template.indexOf('@default'), end: template.indexOf(';') + 1 };

    expect(lines.map(l => l.text)).toEqual([
      'const __switch0 = root.mode();',
      'switch (__switch0) {',
      '  case \'idle\':',
      '    child;',
      '    break;',
      '  default:',
      '    __switch0 satisfies never;',
      '}'
    ]);
    expect(lines[0].mappings![0]).toBeDefined();
    expect(lines[6].mappings).toEqual([{ columnStart: 4, columnEnd: 30, original: exhaustive }]);
    expect(context.exhaustiveSwitches).toEqual([exhaustive]);
    expect(new TypeCheckContext(context).exhaustiveSwitches).toBe(context.exhaustiveSwitches);

    // A @switch of a nested scope is recorded in the outermost one
    typeCheckSwitch(parse(template), processNode, new TypeCheckContext(context));
    expect(context.exhaustiveSwitches).toEqual([exhaustive, exhaustive]);
  });

  it('writes the body of a case declaring element refs in a block of its own, starting with their declarations', () => {
    const template = '@switch (x) { @case (1) { <input #field /> } @default { <select #field /> } }';
    const lines = typeCheckSwitch(parse(template), processNode, new TypeCheckContext());

    expect(lines.map(l => l.text)).toEqual([
      'switch (root.x) {',
      '  case 1:',
      '    {',
      '      let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '      child;',
      '      break;',
      '    }',
      '  default:',
      '    {',
      '      let field!: (HTMLElementTagNameMap extends { \'select\': infer Type } ? Type : HTMLElement);',
      '      child;',
      '      break;',
      '    }',
      '}'
    ]);
  });

  it('maps each case value onto the template', () => {
    const template = '@switch (mode()) { @case (\'a\') @case (Mode.B) { x } @default { y } }';
    const lines = typeCheckSwitch(new Parser(template, new Lexer(template).tokenize()).parse()[0] as SwitchNode, () => [], new TypeCheckContext());

    expect(lines[1]).toEqual({ text: '  case \'a\':', mappings: [{ columnStart: 7, columnEnd: 10, original: { start: template.indexOf('\'a\''), end: template.indexOf('\'a\'') + 3 } }] });
    expect(lines[2].mappings).toEqual([{ columnStart: 7, columnEnd: 13, original: { start: template.indexOf('Mode.B'), end: template.indexOf('Mode.B') + 6 } }]);
  });
});
