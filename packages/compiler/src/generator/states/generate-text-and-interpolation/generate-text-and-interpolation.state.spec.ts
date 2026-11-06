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

  it('generates an interpolation node', async () => {
    expect(await generateTextAndInterpolation(parse('{heading}'), 'root', '0', new GeneratorContext(cache), 'anchor', false)).toEqual({
      code: ['_renderText(root, context, () => this.heading, anchor);']
    });
  });

  it('passes true last for a text the server separates from what precedes it', async () => {
    expect(await generateTextAndInterpolation(parse('{heading}'), 'root', '0', new GeneratorContext(cache), null, true)).toEqual({
      code: ['_renderText(root, context, () => this.heading, null, true);']
    });
    expect(await generateTextAndInterpolation(parse('tail'), 'root', '0', new GeneratorContext(cache), null, true)).toEqual({
      code: ['_renderLiteralText(root, context, \'tail\', null, true);']
    });
  });
});
