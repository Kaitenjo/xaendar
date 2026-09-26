import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { TextNode } from '../../../parser/types/nodes/text-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateTextAndInterpolation } from './generate-text-and-interpolation.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as TextNode | InterpolationNode;

describe('generateTextAndInterpolation', () => {
  it('generates a literal text node', async () => {
    expect(await generateTextAndInterpolation(parse('hello'), 'root', '0', new CompilerContext(), null)).toEqual({
      code: ['_renderLiteralText(root, context, \'hello\', null);']
    });
  });

  it('generates an interpolation node', async () => {
    expect(await generateTextAndInterpolation(parse('{name}'), 'root', '0', new CompilerContext(), 'anchor')).toEqual({
      code: ['_renderText(root, context, () => this.name, anchor);']
    });
  });
});
