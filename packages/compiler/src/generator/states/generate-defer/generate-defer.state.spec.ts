import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateDefer } from './generate-defer.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as DeferNode;

describe('generateDefer', () => {
  it('passes the triggers and the function rendering the content, a scope of its own rendered before the anchor it receives', async () => {
    const context = new CompilerContext();
    const node = parse('@defer (idle) { <b></b> }');
    const { code, functionsToProcess } = await generateDefer(node, 'root', '0', context, null);

    expect(code).toEqual([
      '_defer(root, context, null, {',
      '  triggers: [\'idle\'],',
      '  content: defer0.bind(this)',
      '});'
    ]);
    expect([...functionsToProcess!.keys()]).toEqual(['defer0']);
    expect(functionsToProcess!.get('defer0')).toMatchObject({
      fn: { node, parentNode: 'defer0', anchor: 'anchor' },
      args: ['defer0', 'parentContext', 'anchor', 'nodeStrategy']
    });
    expect(functionsToProcess!.get('defer0')!.fn.context).not.toBe(context);
  });

  it('passes the expression of when, the modules of the content and the functions of the blocks following it, the @error taking the error', async () => {
    const node = parse('@defer (interaction, when ready()) { <b></b> } @error (failure) { <s></s> } @placeholder { <i></i> } @loading { <u></u> }');
    const context = new CompilerContext();
    context.deferredModules = new Map([[node, ['/src/a.ts']]]);
    const { code, functionsToProcess } = await generateDefer(node, 'root', '1', context, 'anchor');

    expect(code).toEqual([
      '_defer(root, context, anchor, {',
      '  triggers: [\'interaction\'],',
      '  when: () => this.ready(),',
      '  load: () => Promise.all([import("/src/a.ts")]),',
      '  content: defer1.bind(this),',
      '  placeholder: placeholder1.bind(this),',
      '  loading: loading1.bind(this),',
      '  error: error1.bind(this)',
      '});'
    ]);
    expect(functionsToProcess!.get('placeholder1')).toMatchObject({ fn: { node: node.placeholder, parentNode: 'placeholder1' }, args: ['placeholder1', 'parentContext', 'anchor', 'nodeStrategy'] });
    expect(functionsToProcess!.get('loading1')).toMatchObject({ fn: { node: node.loading, parentNode: 'loading1' } });
    expect(functionsToProcess!.get('error1')).toMatchObject({
      fn: { node: node.error, parentNode: 'error1', precode: 'context.addIdentifier(\'failure\', error);', anchor: 'anchor' },
      args: ['error1', 'parentContext', 'anchor', 'nodeStrategy', 'error']
    });
    expect(functionsToProcess!.get('error1')!.fn.context.getIdentifierKind('failure')).toBe('value');
    expect(functionsToProcess!.get('defer1')!.fn.context.hasIdentifier('failure')).toBe(false);
  });

  it('declares no error for an @error without a name', async () => {
    const { functionsToProcess } = await generateDefer(parse('@defer (idle) { a } @error { b }'), 'root', '0', new CompilerContext(), null);

    expect(functionsToProcess!.get('error0')!.fn.precode).toBeUndefined();
  });
});
