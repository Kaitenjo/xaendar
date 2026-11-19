import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import { GeneratorContext } from '../../context/context';
import { generateHydrate } from './generate-hydrate.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as HydrateNode;

describe('generateHydrate', () => {
  it('passes the triggers and the function rendering the content, a scope of its own rendered before the anchor it receives', async () => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateHydrate(parse('@hydrate (idle, load) { <b></b> }'), 'root', '0', context, null);

    expect(code).toEqual(['_hydrate(root, context, null, hydrate0$hydrate);']);
    expect(context.constantDeclarations).toEqual(['const hydrate0$hydrate = { triggers: [\'idle\', \'load\'], content: hydrate0 };']);
    expect([...functionsToProcess!.keys()]).toEqual(['hydrate0']);
    expect(functionsToProcess!.get('hydrate0')).toMatchObject({
      fn: { parentNode: 'hydrate0', anchor: 'anchor' },
      args: ['hydrate0', 'parentContext', 'anchor', 'nodeStrategy']
    });
    expect(functionsToProcess!.get('hydrate0')!.fn.context).not.toBe(context);
  });

  it('passes the function of when and the one loading the modules of the content', async () => {
    const node = parse('@hydrate (visible, when ready()) { <b></b> }');
    const context = new GeneratorContext(cache);
    context.deferredModules = new Map([[node, ['/src/a.ts', '/src/b.ts']]]);
    const { code } = await generateHydrate(node, 'div0', '1', context, 'anchor');

    expect(code).toEqual(['_hydrate(div0, context, anchor, div0__hydrate1$hydrate);']);
    expect(context.constantDeclarations).toEqual([[
      'const div0__hydrate1$hydrate = {',
      '  triggers: [\'visible\'],',
      '  when: div0__hydrate1$when,',
      '  load: div0__hydrate1$load,',
      '  content: div0__hydrate1',
      '};'
    ].join('\n')]);
    expect(context.functionDeclarations).toEqual([
      'function div0__hydrate1$when(context) {\n  return this.ready();\n}',
      'function div0__hydrate1$load() {\n  return Promise.all([import("/src/a.ts"), import("/src/b.ts")]);\n}'
    ]);
  });

  it('passes no triggers written by name when only when triggers the block', async () => {
    const context = new GeneratorContext(cache);
    await generateHydrate(parse('@hydrate (when ready()) { <b></b> }'), 'root', '0', context, null);

    expect(context.constantDeclarations).toEqual(['const hydrate0$hydrate = { triggers: [], when: hydrate0$when, content: hydrate0 };']);
  });

  it('declares the last node of its parent last, its content forwarding no anchor', async () => {
    const context = new GeneratorContext(cache);
    const { code, functionsToProcess } = await generateHydrate(parse('@hydrate (idle) { <b></b> }'), 'td0', '0', context, null, false, true);

    expect(code).toEqual(['_hydrate(td0, context, null, td0__hydrate0$hydrate);']);
    expect(context.constantDeclarations).toEqual(['const td0__hydrate0$hydrate = { triggers: [\'idle\'], content: td0__hydrate0, last: true };']);
    expect(functionsToProcess!.get('td0__hydrate0')!.fn).toHaveProperty('anchor', undefined);
  });

  it('declares the slot of its anchor at the top of a scope tracking its nodes, which owns the nodes of the server', async () => {
    const context = new GeneratorContext(cache);
    context.tracksNodes = true;
    await generateHydrate(parse('@hydrate (idle) { <b></b> }'), 'for0', '0', context, 'anchor');

    expect(context.constantDeclarations).toEqual(['const for0__hydrate0$hydrate = { triggers: [\'idle\'], content: for0__hydrate0, slot: 5, track: true };']);
  });
});
