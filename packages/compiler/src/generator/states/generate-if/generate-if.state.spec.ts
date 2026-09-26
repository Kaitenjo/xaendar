import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { IfNode } from '../../../parser/types/nodes/if-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateIf } from './generate-if.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as IfNode;

describe('generateIf', () => {
  it('generates a single conditional block', async () => {
    const { code, functionsToProcess } = await generateIf(parse('@if (a) { <b></b> }'), 'root', '0', new CompilerContext(), null);

    expect(code.join('\n')).toBe([
      '_if(root, context, null, [',
      '  {',
      '    condition: () => this.a,',
      '    block: this.if0.bind(this)',
      '  },',
      ']);'
    ].join('\n'));
    expect([...functionsToProcess?.keys() ?? []]).toEqual(['if0']);
    expect(functionsToProcess?.get('if0')?.args).toEqual(['if0', 'parentContext', 'anchor']);
  });

  it('generates else-if and else branches', async () => {
    const template = '@if (a) { <b></b> } @else if (b) { <i></i> } @else if (c) { <u></u> } @else { <s></s> }';
    const { code, functionsToProcess } = await generateIf(parse(template), 'root', '0', new CompilerContext(), 'anchor');
    const output = code.join('\n');

    expect(output).toContain('condition: () => this.b,');
    expect(output).toContain('block: this.elseIf0_0.bind(this)');
    expect(output).toContain('block: this.elseIf0_1.bind(this)');
    expect(output).toContain('block: this.else0.bind(this)');
    expect([...functionsToProcess?.keys() ?? []]).toEqual(['if0', 'elseIf0_0', 'elseIf0_1', 'else0']);
    expect(functionsToProcess?.get('else0')?.args).toEqual(['root', 'parentContext', 'anchor']);
  });
});
