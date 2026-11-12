import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { GeneratorContext } from '../../context/context';
import { generateDefer } from './generate-defer.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as DeferNode;

describe('generateDefer', () => {
  it('passes the triggers and the function rendering the content, a scope of its own rendered before the anchor it receives', async () => {
    const context = new GeneratorContext(cache);
    const node = parse('@defer (idle) { <b></b> }');
    const { code, functionsToProcess } = await generateDefer(node, 'root', '0', context, null);

    expect(code).toEqual(['_defer(root, context, null, defer0$defer);']);
    expect(context.constantDeclarations).toEqual(['const defer0$defer = { triggers: [\'idle\'], content: defer0 };']);
    expect([...functionsToProcess!.keys()]).toEqual(['defer0']);
    expect(functionsToProcess!.get('defer0')).toMatchObject({
      fn: { node, parentNode: 'defer0', anchor: 'anchor' },
      args: ['defer0', 'parentContext', 'anchor', 'nodeStrategy']
    });
    expect(functionsToProcess!.get('defer0')!.fn.context).not.toBe(context);
  });

  it('passes the function of when, the one loading the modules of the content and the functions of the blocks following it, the @error taking the error', async () => {
    const node = parse('@defer (interaction, when ready()) { <b></b> } @error (failure) { <s></s> } @placeholder { <i></i> } @loading { <u></u> }');
    const context = new GeneratorContext(cache);
    context.deferredModules = new Map([[node, ['/src/a.ts']]]);
    const { code, functionsToProcess } = await generateDefer(node, 'div0', '1', context, 'anchor');

    expect(code).toEqual(['_defer(div0, context, anchor, div0__defer1$defer);']);
    expect(context.constantDeclarations).toEqual([[
      'const div0__defer1$defer = {',
      '  triggers: [\'interaction\'],',
      '  when: div0__defer1$when,',
      '  load: div0__defer1$load,',
      '  content: div0__defer1,',
      '  placeholder: div0__placeholder1,',
      '  loading: div0__loading1,',
      '  error: div0__error1',
      '};'
    ].join('\n')]);
    expect(context.functionDeclarations).toEqual([
      'function div0__defer1$when(context) {\n  return this.ready();\n}',
      'function div0__defer1$load() {\n  return Promise.all([import("/src/a.ts")]);\n}'
    ]);
    expect(functionsToProcess!.get('div0__placeholder1')).toMatchObject({ fn: { node: node.placeholder, parentNode: 'div0__placeholder1' }, args: ['div0__placeholder1', 'parentContext', 'anchor', 'nodeStrategy'] });
    expect(functionsToProcess!.get('div0__loading1')).toMatchObject({ fn: { node: node.loading, parentNode: 'div0__loading1' } });
    expect(functionsToProcess!.get('div0__error1')).toMatchObject({
      fn: { node: node.error, parentNode: 'div0__error1', precode: 'context[8] = error;', anchor: 'anchor' },
      args: ['div0__error1', 'parentContext', 'anchor', 'nodeStrategy', 'error']
    });
    expect(functionsToProcess!.get('div0__error1')!.fn.context.getIdentifierKind('failure')).toBe('value');
    expect(functionsToProcess!.get('div0__defer1')!.fn.context.hasIdentifier('failure')).toBe(false);
  });

  it('passes the times of the @placeholder and of the @loading, in milliseconds, after the function of each one', async () => {
    const node = parse('@defer { <b></b> } @placeholder (minimum 500ms) { <i></i> } @loading (after 100ms, minimum 1s) { <u></u> }');
    const context = new GeneratorContext(cache);
    const { code } = await generateDefer(node, 'root', '2', context, null);

    expect(code).toEqual(['_defer(root, context, null, defer2$defer);']);
    expect(context.constantDeclarations).toEqual([[
      'const defer2$defer = {',
      '  triggers: [\'idle\'],',
      '  content: defer2,',
      '  placeholder: placeholder2,',
      '  placeholderMinimum: 500,',
      '  loading: loading2,',
      '  loadingAfter: 100,',
      '  loadingMinimum: 1000',
      '};'
    ].join('\n')]);
  });

  it('passes only the times declared', async () => {
    const context = new GeneratorContext(cache);
    await generateDefer(parse('@defer { <b></b> } @loading (minimum 1s) { <u></u> }'), 'root', '0', context, null);

    expect(context.constantDeclarations).toEqual(['const defer0$defer = { triggers: [\'idle\'], content: defer0, loading: loading0, loadingMinimum: 1000 };']);
  });

  it('declares no error for an @error without a name', async () => {
    const { functionsToProcess } = await generateDefer(parse('@defer (idle) { a } @error { b }'), 'root', '0', new GeneratorContext(cache), null);

    expect(functionsToProcess!.get('error0')!.fn.precode).toBeUndefined();
  });

  it('declares the last node of its parent last, its content and the blocks following it forwarding no anchor', async () => {
    const context = new GeneratorContext(cache);
    const node = parse('@defer (idle) { a } @placeholder { p } @loading { l } @error (failure) { e }');
    const { code, functionsToProcess } = await generateDefer(node, 'td0', '0', context, null, false, true);

    expect(code).toEqual(['_defer(td0, context, null, td0__defer0$defer);']);
    expect(context.constantDeclarations).toEqual([[
      'const td0__defer0$defer = {',
      '  triggers: [\'idle\'],',
      '  content: td0__defer0,',
      '  placeholder: td0__placeholder0,',
      '  loading: td0__loading0,',
      '  error: td0__error0,',
      '  last: true',
      '};'
    ].join('\n')]);
    expect([...functionsToProcess!.keys()]).toEqual(['td0__defer0', 'td0__placeholder0', 'td0__loading0', 'td0__error0']);
    for (const { fn } of functionsToProcess!.values()) {
      expect(fn).toHaveProperty('anchor', undefined);
    }
    expect(functionsToProcess!.get('td0__error0')!.fn.precode).toBe('context[8] = error;');
  });
});
