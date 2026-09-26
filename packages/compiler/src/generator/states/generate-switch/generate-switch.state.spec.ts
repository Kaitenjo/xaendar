import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { SwitchNode } from '../../../parser/types/nodes/switch-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateSwitch } from './generate-switch.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as SwitchNode;

describe('generateSwitch', () => {
  it('generates cases, grouped cases and default', async () => {
    const template = '@switch (x) { @case (1) { <a></a> } @case (2) @case (3) { <b></b> } @default { <c></c> } }';
    const { code, functionsToProcess } = await generateSwitch(parse(template), 'root', '0', new CompilerContext(), null);
    const output = code.join('\n');

    expect(code[0]).toBe('_switch(root, context, null, () => this.x, [');
    expect(output).toContain('condition: [1],');
    expect(output).toContain('condition: [2, 3],');
    expect(output).toContain('condition: null,');
    expect(output).toContain('block: this.case0_0.bind(this)');
    expect(output).toContain('block: this.default0.bind(this)');
    expect(code.at(-1)).toBe('])');
    expect([...functionsToProcess?.keys() ?? []]).toEqual(['case0_0', 'case0_1', 'default0']);
  });
});
