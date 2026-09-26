import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { InterpolationNode } from '../../../parser/types/nodes/interpolation-node.type';
import { TextNode } from '../../../parser/types/nodes/text-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { typeCheckTextAndInterpolation } from './type-check-text-and-interpolation.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as TextNode | InterpolationNode;

describe('typeCheckTextAndInterpolation', () => {
  it('produces no lines for plain text', () => {
    expect(typeCheckTextAndInterpolation(parse('hello'), () => [], new TypeCheckContext())).toEqual([]);
  });

  it('emits the interpolation expression as a mapped statement', () => {
    const [line] = typeCheckTextAndInterpolation(parse('{name}'), () => [], new TypeCheckContext());
    expect(line.text).toBe('root.name;');
    expect(line.mappings).toHaveLength(1);
  });
});
