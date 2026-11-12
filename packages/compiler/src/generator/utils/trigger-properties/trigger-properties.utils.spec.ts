import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { GeneratorContext } from '../../context/context';
import { getTriggerProperties } from './trigger-properties.utils';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as DeferNode;

describe('getTriggerProperties', () => {
  it('passes the names of the variables of the template the when expressions read, before and after prefetch', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');
    const node = parse('@defer (when row.ready, prefetch when row.near) { <b></b> }');
    context.deferredModules = new Map([[node, ['/card.ts']]]);

    expect(getTriggerProperties(node, 'defer0', context)).toEqual([
      'triggers: []',
      'when: defer0$when',
      'whenReads: _reads0',
      'load: defer0$load',
      'prefetchWhen: defer0$prefetchWhen',
      'prefetchWhenReads: _reads0'
    ]);
    expect(context.functionDeclarations).toEqual([
      'function defer0$when(context) {\n  return _read(context, 0, 5).ready;\n}',
      'function defer0$load() {\n  return Promise.all([import("/card.ts")]);\n}',
      'function defer0$prefetchWhen(context) {\n  return _read(context, 0, 5).near;\n}'
    ]);
    expect(context.readsDeclarations).toEqual(['const _reads0 = [0];']);
  });

  it('writes the triggers by name, then the function of when and the one loading the modules of the content', () => {
    const node = parse('@defer (visible, when ready(), idle) { <b></b> }');
    const context = new GeneratorContext(cache);
    context.deferredModules = new Map([[node, ['/src/a.ts', '/src/b.ts']]]);

    expect(getTriggerProperties(node, 'div0__defer0', context)).toEqual([
      'triggers: [\'visible\', \'idle\']',
      'when: div0__defer0$when',
      'load: div0__defer0$load'
    ]);
    expect(context.functionDeclarations).toEqual([
      'function div0__defer0$when(context) {\n  return this.ready();\n}',
      'function div0__defer0$load() {\n  return Promise.all([import("/src/a.ts"), import("/src/b.ts")]);\n}'
    ]);
  });

  it('writes no trigger by name when only when triggers the block, and nothing to load without modules', () => {
    const context = new GeneratorContext(cache);

    expect(getTriggerProperties(parse('@defer (when ready()) { <b></b> }'), 'defer0', context)).toEqual(['triggers: []', 'when: defer0$when']);
    expect(getTriggerProperties(parse('@defer (load) { <b></b> }'), 'defer1', context)).toEqual(['triggers: [\'load\']']);
    expect(context.functionDeclarations).toEqual(['function defer0$when(context) {\n  return this.ready();\n}']);
  });

  it('waits for the browser to be idle without a trigger rendering the content', () => {
    expect(getTriggerProperties(parse('@defer { <b></b> }'), 'defer0', new GeneratorContext(cache))).toEqual(['triggers: [\'idle\']']);
    expect(getTriggerProperties(parse('@defer (prefetch hover) { <b></b> }'), 'defer0', new GeneratorContext(cache))).toEqual(['triggers: [\'idle\']']);
  });

  it('describes the triggers written with arguments, reading the element they name with a function, the options of visible reading names computed by one', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('more', 'value');

    expect(getTriggerProperties(parse('@defer (idle(500ms), timer(2s), hover(more), interaction(more), visible(more, { rootMargin: margin() })) { <b></b> }'), 'defer0', context)).toEqual([[
      'triggers: [',
      '  { kind: \'idle\', timeout: 500 },',
      '  { kind: \'timer\', delay: 2000 },',
      '  { kind: \'hover\', target: defer0$hover_target },',
      '  { kind: \'interaction\', target: defer0$interaction_target },',
      '  { kind: \'visible\', target: defer0$visible_target, options: defer0$visible_options }',
      ']'
    ].join('\n')]);
    expect(context.functionDeclarations).toEqual([
      'function defer0$hover_target(context) {\n  return _read(context, 0, 5);\n}',
      'function defer0$interaction_target(context) {\n  return _read(context, 0, 5);\n}',
      'function defer0$visible_target(context) {\n  return _read(context, 0, 5);\n}',
      'function defer0$visible_options(context) {\n  return ({ rootMargin: this.margin() });\n}'
    ]);
  });

  it('writes the options of visible in the constant when they read no name', () => {
    const context = new GeneratorContext(cache);

    expect(getTriggerProperties(parse('@defer (visible({ threshold: 1 }), hover) { <b></b> }'), 'defer0', context)).toEqual([
      'triggers: [{ kind: \'visible\', options: ({ threshold: 1 }) }, \'hover\']'
    ]);
    expect(context.functionDeclarations).toEqual([]);
  });

  it('writes the triggers following prefetch, only with modules to load, their functions named apart from the ones of the triggers rendering the content', () => {
    const node = parse('@defer (hover(more), prefetch idle, prefetch hover(more), prefetch when soon()) { <b></b> }');
    const context = new GeneratorContext(cache);
    context.addIdentifier('more', 'value');

    expect(getTriggerProperties(node, 'defer0', context)).toEqual(['triggers: [{ kind: \'hover\', target: defer0$hover_target }]']);
    context.deferredModules = new Map([[node, ['/src/a.ts']]]);
    expect(getTriggerProperties(node, 'defer1', context)).toEqual([
      'triggers: [{ kind: \'hover\', target: defer1$hover_target }]',
      'load: defer1$load',
      'prefetch: [\'idle\', { kind: \'hover\', target: defer1$prefetch_hover_target }]',
      'prefetchWhen: defer1$prefetchWhen'
    ]);
    expect(context.functionDeclarations).toEqual([
      'function defer0$hover_target(context) {\n  return _read(context, 0, 5);\n}',
      'function defer1$hover_target(context) {\n  return _read(context, 0, 5);\n}',
      'function defer1$load() {\n  return Promise.all([import("/src/a.ts")]);\n}',
      'function defer1$prefetch_hover_target(context) {\n  return _read(context, 0, 5);\n}',
      'function defer1$prefetchWhen(context) {\n  return this.soon();\n}'
    ]);
  });
});
