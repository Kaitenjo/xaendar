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
  it('writes the triggers by name, then the expression of when and the modules of the content', () => {
    const node = parse('@defer (visible, when ready(), idle) { <b></b> }');
    const context = new GeneratorContext(cache);
    context.deferredModules = new Map([[node, ['/src/a.ts', '/src/b.ts']]]);

    expect(getTriggerProperties(node, context)).toEqual([
      'triggers: [\'visible\', \'idle\']',
      'when: () => this.ready()',
      'load: () => Promise.all([import("/src/a.ts"), import("/src/b.ts")])'
    ]);
  });

  it('writes no trigger by name when only when triggers the block, and nothing to load without modules', () => {
    expect(getTriggerProperties(parse('@defer (when ready()) { <b></b> }'), new GeneratorContext(cache))).toEqual(['triggers: []', 'when: () => this.ready()']);
    expect(getTriggerProperties(parse('@defer (load) { <b></b> }'), new GeneratorContext(cache))).toEqual(['triggers: [\'load\']']);
  });

  it('waits for the browser to be idle without a trigger rendering the content', () => {
    expect(getTriggerProperties(parse('@defer { <b></b> }'), new GeneratorContext(cache))).toEqual(['triggers: [\'idle\']']);
    expect(getTriggerProperties(parse('@defer (prefetch hover) { <b></b> }'), new GeneratorContext(cache))).toEqual(['triggers: [\'idle\']']);
  });

  it('describes the triggers written with arguments, reading the element they name once called', () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('more', 'value');

    expect(getTriggerProperties(parse('@defer (idle(500ms), timer(2s), hover(more), interaction(more), visible(more, { rootMargin: margin() })) { <b></b> }'), context)).toEqual([
      'triggers: [{ kind: \'idle\', timeout: 500 }, { kind: \'timer\', delay: 2000 }, { kind: \'hover\', target: () => context.get(\'more\') }, { kind: \'interaction\', target: () => context.get(\'more\') }, { kind: \'visible\', target: () => context.get(\'more\'), options: ({ rootMargin: this.margin() }) }]'
    ]);
    expect(getTriggerProperties(parse('@defer (visible({ threshold: 1 }), hover) { <b></b> }'), context)).toEqual([
      'triggers: [{ kind: \'visible\', options: ({ threshold: 1 }) }, \'hover\']'
    ]);
  });

  it('writes the triggers following prefetch, only with modules to load', () => {
    const node = parse('@defer (interaction, prefetch idle, prefetch hover(more), prefetch when soon()) { <b></b> }');
    const context = new GeneratorContext(cache);
    context.addIdentifier('more', 'value');

    expect(getTriggerProperties(node, context)).toEqual(['triggers: [\'interaction\']']);
    context.deferredModules = new Map([[node, ['/src/a.ts']]]);
    expect(getTriggerProperties(node, context)).toEqual([
      'triggers: [\'interaction\']',
      'load: () => Promise.all([import("/src/a.ts")])',
      'prefetch: [\'idle\', { kind: \'hover\', target: () => context.get(\'more\') }]',
      'prefetchWhen: () => this.soon()'
    ]);
  });
});
