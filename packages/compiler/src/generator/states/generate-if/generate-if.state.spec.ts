import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { IfNode } from '../../../parser/types/nodes/if-node.type';
import { GeneratorContext } from '../../context/context';
import { generateIf } from './generate-if.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as IfNode;

describe('generateIf', () => {
  it('generates a single conditional block', async () => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateIf(parse('@if (a) { <b></b> }'), 'root', '0', context, null);

    expect(code).toEqual(['_if(root, context, null, if0$if);']);
    expect(context.constantDeclarations).toEqual(['const if0$if = { branches: [{ condition: if0$condition, block: if0 }] };']);
    expect(context.functionDeclarations).toEqual(['function if0$condition(context) {\n  return this.a;\n}']);
    expect([...functionsToProcess!.keys()]).toEqual(['if0']);
    expect(functionsToProcess!.get('if0')!.args).toEqual(['if0', 'parentContext', 'anchor', 'nodeStrategy']);
  });

  it('generates else-if and else branches', async () => {
    const context = new GeneratorContext(cache);
    const template = '@if (a) { <b></b> } @else if (b) { <i></i> } @else if (c) { <u></u> } @else { <s></s> }';
    const { code, functionsToProcess } = await generateIf(parse(template), 'root', '0', context, 'anchor');

    expect(code).toEqual(['_if(root, context, anchor, if0$if);']);
    expect(context.constantDeclarations).toEqual([[
      'const if0$if = {',
      '  branches: [',
      '    { condition: if0$condition, block: if0 },',
      '    { condition: elseIf0_0$condition, block: elseIf0_0 },',
      '    { condition: elseIf0_1$condition, block: elseIf0_1 },',
      '    { block: else0 }',
      '  ]',
      '};'
    ].join('\n')]);
    expect(context.functionDeclarations).toEqual([
      'function if0$condition(context) {\n  return this.a;\n}',
      'function elseIf0_0$condition(context) {\n  return this.b;\n}',
      'function elseIf0_1$condition(context) {\n  return this.c;\n}'
    ]);
    expect([...functionsToProcess!.keys()]).toEqual(['if0', 'elseIf0_0', 'elseIf0_1', 'else0']);
  });

  it('lists the variables of the template the conditions read in the configuration, from every branch', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');
    context.addIdentifier('col', 'variable');
    await generateIf(parse('@if (row.done) { a } @else if (col.done) { b }'), 'div0', '0', context, null);

    expect(context.constantDeclarations).toEqual([[
      'const div0__if0$if = {',
      '  branches: [',
      '    { condition: div0__if0$condition, block: div0__if0 },',
      '    { condition: div0__elseIf0_0$condition, block: div0__elseIf0_0 }',
      '  ],',
      '  reads: _reads0',
      '};'
    ].join('\n')]);
    expect(context.readsDeclarations).toEqual(['const _reads0 = [0, 1];']);
  });

  it('makes every branch the parent of its own content', async () => {
    const template = '@if (a) { <b></b> } @else if (b) { <i></i> } @else { <s></s> }';
    const { functionsToProcess } = await generateIf(parse(template), 'root', '0', new GeneratorContext(cache), null);

    const keys = ['if0', 'elseIf0_0', 'else0'];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      expect(functionsToProcess?.get(key)?.fn.parentNode).toBe(key);
      expect(functionsToProcess?.get(key)?.args).toEqual([key, 'parentContext', 'anchor', 'nodeStrategy']);
    }
  });

  it('declares the last node of its parent last, its branches forwarding no anchor', async () => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateIf(parse('@if (a) { <b></b> } @else if (b) { <i></i> } @else { <s></s> }'), 'td0', '0', context, null, false, true);

    expect(code).toEqual(['_if(td0, context, null, td0__if0$if);']);
    expect(context.constantDeclarations).toEqual([[
      'const td0__if0$if = {',
      '  branches: [',
      '    { condition: td0__if0$condition, block: td0__if0 },',
      '    { condition: td0__elseIf0_0$condition, block: td0__elseIf0_0 },',
      '    { block: td0__else0 }',
      '  ],',
      '  last: true',
      '};'
    ].join('\n')]);
    for (const { fn } of functionsToProcess!.values()) {
      expect(fn).toHaveProperty('anchor', undefined);
    }
  });

  it('forwards the anchor to the branches of a block that is not last', async () => {
    const { functionsToProcess } = await generateIf(parse('@if (a) { <b></b> } @else { <s></s> }'), 'td0', '0', new GeneratorContext(cache), null, false, false);

    for (const { fn } of functionsToProcess!.values()) {
      expect(fn.anchor).toBe('anchor');
    }
  });
});
