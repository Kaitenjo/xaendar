import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../parser/parser';
import type { ForNode } from '../../types/nodes/for-node.type';
import { getForVariables } from './for-variables.utils';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('getForVariables', () => {
  it('returns the item alias and the implicit variables, by their alias if any', () => {
    const [withAlias] = parse('@for (item of items; track item(); f = $first) {}') as ForNode[];
    const [withoutAlias] = parse('@for (3) {}') as ForNode[];

    expect(getForVariables(withAlias)).toEqual(['item', '$index', 'f', '$last', '$even', '$odd']);
    expect(getForVariables(withoutAlias)).toEqual(['$index', '$first', '$last', '$even', '$odd']);
  });
});
