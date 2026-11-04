import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { HydrateNode } from '../../../parser/types/nodes/hydrate-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateHydrate } from './generate-hydrate.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as HydrateNode;

describe('generateHydrate', () => {
  it('passes the triggers and the function rendering the content, a scope of its own rendered before the anchor it receives', async () => {
    const context = new CompilerContext();
    const { code, functionsToProcess } = await generateHydrate(parse('@hydrate (idle, load) { <b></b> }'), 'root', '0', context, null);

    expect(code).toEqual([
      '_hydrate(root, context, null, {',
      '  triggers: [\'idle\', \'load\'],',
      '  content: hydrate0.bind(this)',
      '});'
    ]);
    expect([...functionsToProcess!.keys()]).toEqual(['hydrate0']);
    expect(functionsToProcess!.get('hydrate0')).toMatchObject({
      fn: { parentNode: 'hydrate0', anchor: 'anchor' },
      args: ['hydrate0', 'parentContext', 'anchor', 'nodeStrategy']
    });
    expect(functionsToProcess!.get('hydrate0')!.fn.context).not.toBe(context);
  });

  it('passes the expression of when and the modules of the content', async () => {
    const node = parse('@hydrate (visible, when ready()) { <b></b> }');
    const context = new CompilerContext();
    context.deferredModules = new Map([[node, ['/src/a.ts', '/src/b.ts']]]);
    const { code } = await generateHydrate(node, 'root', '1', context, 'anchor');

    expect(code).toEqual([
      '_hydrate(root, context, anchor, {',
      '  triggers: [\'visible\'],',
      '  when: () => this.ready(),',
      '  load: () => Promise.all([import("/src/a.ts"), import("/src/b.ts")]),',
      '  content: hydrate1.bind(this)',
      '});'
    ]);
  });

  it('passes no triggers written by name when only when triggers the block', async () => {
    const { code } = await generateHydrate(parse('@hydrate (when ready()) { <b></b> }'), 'root', '0', new CompilerContext(), null);

    expect(code[1]).toBe('  triggers: [],');
  });
});
