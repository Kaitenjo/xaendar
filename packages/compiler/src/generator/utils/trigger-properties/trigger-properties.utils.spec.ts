import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { getTriggerProperties } from './trigger-properties.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as DeferNode;

describe('getTriggerProperties', () => {
  it('writes the triggers by name, then the expression of when and the modules of the content', () => {
    const node = parse('@defer (visible, when ready(), idle) { <b></b> }');
    const context = new CompilerContext();
    context.deferredModules = new Map([[node, ['/src/a.ts', '/src/b.ts']]]);

    expect(getTriggerProperties(node, context)).toEqual([
      'triggers: [\'visible\', \'idle\']',
      'when: () => this.ready()',
      'load: () => Promise.all([import("/src/a.ts"), import("/src/b.ts")])'
    ]);
  });

  it('writes no trigger by name when only when triggers the block, and nothing to load without modules', () => {
    expect(getTriggerProperties(parse('@defer (when ready()) { <b></b> }'), new CompilerContext())).toEqual(['triggers: []', 'when: () => this.ready()']);
    expect(getTriggerProperties(parse('@defer (load) { <b></b> }'), new CompilerContext())).toEqual(['triggers: [\'load\']']);
  });
});
