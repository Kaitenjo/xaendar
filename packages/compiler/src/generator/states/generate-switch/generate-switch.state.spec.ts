import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { SwitchNode } from '../../../parser/types/nodes/switch-node.type';
import { GeneratorContext } from '../../context/context';
import { generateSwitch } from './generate-switch.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as SwitchNode;

describe('generateSwitch', () => {
  it('generates cases, grouped cases and default', async () => {
    const template = '@switch (x) { @case (1) { <a></a> } @case (2) @case (3) { <b></b> } @default { <c></c> } }';
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateSwitch(parse(template), 'root', '0', context, null);

    expect(code).toEqual(['_switch(root, context, null, switch0$switch);']);
    expect(context.constantDeclarations).toEqual([[
      'const switch0$switch = {',
      '  expression: switch0$expression,',
      '  branches: [',
      '    { condition: [1], block: case0_0 },',
      '    { condition: [2, 3], block: case0_1 },',
      '    { condition: null, block: default0 }',
      '  ]',
      '};'
    ].join('\n')]);
    expect(context.functionDeclarations).toEqual(['function switch0$expression(context) {\n  return this.x;\n}']);
    expect([...functionsToProcess!.keys()]).toEqual(['case0_0', 'case0_1', 'default0']);
  });

  it('lists the variables of the template the expression reads in the configuration', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('col', 'variable');
    await generateSwitch(parse('@switch (col.type) { @case (\'text\') { a } }'), 'td0', '0', context, null);

    expect(context.constantDeclarations).toEqual([[
      'const td0__switch0$switch = {',
      '  expression: td0__switch0$expression,',
      '  branches: [{ condition: [\'text\'], block: td0__case0_0 }],',
      '  reads: _reads0',
      '};'
    ].join('\n')]);
    expect(context.functionDeclarations).toEqual(['function td0__switch0$expression(context) {\n  return context.get(\'col\').type;\n}']);
    expect(context.readsDeclarations).toEqual(['const _reads0 = [\'col\'];']);
  });

  it('renders the content of every branch before the anchor its function receives', async () => {
    const template = '@switch (x) { @case (1) { <a></a> } @default { <c></c> } }';
    const { functionsToProcess } = await generateSwitch(parse(template), 'root', '0', new GeneratorContext(cache), null);

    expect([...functionsToProcess?.values() ?? []].map(({ fn, args }) => [fn.anchor, args])).toEqual([
      ['anchor', ['case0_0', 'parentContext', 'anchor', 'nodeStrategy']],
      ['anchor', ['default0', 'parentContext', 'anchor', 'nodeStrategy']]
    ]);
  });

  it('forwards the anchor it is rendered before to the runtime', async () => {
    const { code } = await generateSwitch(parse('@switch (x) { @case (1) { <a></a> } }'), 'if0', '0', new GeneratorContext(cache), 'anchor');

    expect(code).toEqual(['_switch(if0, context, anchor, if0__switch0$switch);']);
  });
});
