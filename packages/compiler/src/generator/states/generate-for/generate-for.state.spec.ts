import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateFor } from './generate-for.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ForNode;

describe('generateFor', () => {
  it('generates the _for call and registers the loop body function', async () => {
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item.id) { <li></li> }'), 'root', '0', new CompilerContext(), null);

    expect(code).toEqual(['_for(root, context, null, () => this.items, (item, $index) => item.id, this.for0.bind(this));']);

    const body = functionsToProcess?.get('for0');
    expect(body?.args).toEqual(['for0', 'parentContext', 'items0', 'i0', 'anchor']);
    expect(body?.fn).toMatchObject({ parentNode: 'for0', anchor: 'anchor', isForBody: true });
    expect(body?.fn.precode).toContain('_iterationVariables(context, items0, i0, \'item\'');
    expect(body?.fn.precode).toContain('const { item, $index, $first, $last, $even, $odd } = vars;');
  });

  it('uses the iterable as-is when it is declared in scope', async () => {
    const { code } = await generateFor(parse('@for (item of items; track item) { <li></li> }'), 'root', '0', new CompilerContext(undefined, ['items']), 'anchor');
    expect(code[0]).toContain('_for(root, context, anchor, () => items,');
  });

  it('applies the aliases declared for implicit variables', async () => {
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item; i = $index) { <li></li> }'), 'root', '0', new CompilerContext(), null);

    expect(code[0]).toContain('(item, i) => item');
    expect(functionsToProcess?.get('for0')?.fn.precode).toContain('const { item, i, $first, $last, $even, $odd } = vars;');
  });
});
