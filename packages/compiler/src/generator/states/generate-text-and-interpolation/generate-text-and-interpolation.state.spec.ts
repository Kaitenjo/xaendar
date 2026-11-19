import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { TextNode } from '../../../parser/types/nodes/text-node.type';
import { GeneratorContext } from '../../context/context';
import { generateTextAndInterpolation } from './generate-text-and-interpolation.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as TextNode | InterpolationNode;

describe('generateTextAndInterpolation', () => {
  it('generates a literal text node', async () => {
    expect(await generateTextAndInterpolation(parse('hello'), 'root', '0', new GeneratorContext(cache), null, false)).toEqual({
      code: ['_renderLiteralText(root, context, \'hello\', null);']
    });
  });

  it('generates an interpolation node, its expression a function of the module named after the parent node and the index', async () => {
    const context = new GeneratorContext(cache);

    expect(await generateTextAndInterpolation(parse('{heading}'), 'span0', '1', context, 'anchor', false)).toEqual({
      code: ['_renderText(span0, context, span0$text1$binding, anchor);']
    });
    expect(context.functionDeclarations).toEqual(['function span0$text1(context) {\n  return this.heading;\n}']);
  });

  it('lists the variables of the template the interpolation reads in its binding', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');

    expect(await generateTextAndInterpolation(parse('{row.name}'), 'td0', '0', context, null, false)).toEqual({
      code: ['_renderText(td0, context, td0$text0$binding, null);']
    });
    expect(await generateTextAndInterpolation(parse('{row.id}'), 'td1', '0', context, null, true)).toEqual({
      code: ['_renderText(td1, context, td1$text0$binding, null, true);']
    });
    expect(context.readsDeclarations).toEqual(['const _reads0 = [0];']);
    expect(context.functionDeclarations).toEqual([
      'function td0$text0(context) {\n  return _read(context, 0, 5).name;\n}',
      'function td1$text0(context) {\n  return _read(context, 0, 5).id;\n}'
    ]);
  });

  it('passes true last for a text the server separates from what precedes it', async () => {
    expect(await generateTextAndInterpolation(parse('{heading}'), 'root', '0', new GeneratorContext(cache), null, true)).toEqual({
      code: ['_renderText(root, context, root$text0$binding, null, true);']
    });
    expect(await generateTextAndInterpolation(parse('tail'), 'root', '0', new GeneratorContext(cache), null, true)).toEqual({
      code: ['_renderLiteralText(root, context, \'tail\', null, true);']
    });
  });

  it('reserves the slots of the binding in the scope, the target one only when it reads variables, and passes the slot of a node it tracks', async () => {
    const context = new GeneratorContext(cache);
    context.addIdentifier('row', 'variable');
    context.tracksNodes = true;

    expect(await generateTextAndInterpolation(parse('{row.name}'), 'block0', '0', context, 'anchor', false)).toEqual({
      code: ['_renderText(block0, context, block0$text0$binding, anchor, false, 6);']
    });
    expect(await generateTextAndInterpolation(parse('{heading}'), 'block0', '1', context, 'anchor', true)).toEqual({
      code: ['_renderText(block0, context, block0$text1$binding, anchor, true, 7);']
    });
    expect(context.constantDeclarations).toEqual([
      'const block0$text0$binding = { value: block0$text0, reads: _reads0, update: _updateText, effect: 0, target: 1 };',
      'const block0$text1$binding = { value: block0$text1, update: _updateText, effect: 2 };'
    ]);
  });

  it('declares the binding of a text rendered in a scope the runtime creates without slots', async () => {
    const root = new GeneratorContext(cache);
    root.addIdentifier('row', 'variable');
    const context = new GeneratorContext(root, undefined, 'runtime');

    expect(await generateTextAndInterpolation(parse('{row.name}'), 'p0', '0', context, null, false)).toEqual({
      code: ['_renderText(p0, context, p0$text0$binding, null);']
    });
    expect(root.constantDeclarations).toEqual(['const p0$text0$binding = { value: p0$text0, reads: _reads0 };']);
    expect(root.declareLayout()).toBe('_layout0');
    expect(root.constantDeclarations[1]).toBe('const _layout0 = { size: 6, nodes: 6, variables: [\'row\'] };');
  });
});
