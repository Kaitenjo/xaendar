import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ForNode } from '../../../parser/types/nodes/for-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateFor } from './generate-for.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ForNode;

/**
 * Builds a scope declaring the given identifiers.
 */
const contextWith = (...identifiers: string[]) => {
  const context = new CompilerContext();
  identifiers.forEach(identifier => context.addIdentifier(identifier));
  return context;
};

describe('generateFor', () => {
  it('generates the _for call and registers the loop body function', async () => {
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item.id) { <li></li> }'), 'root', '0', new CompilerContext(), null);

    expect(code).toEqual(['_for(root, context, null, () => this.items, (item, $index) => item.id, for0.bind(this));']);

    const body = functionsToProcess?.get('for0');
    expect(body?.args).toEqual(['for0', 'parentContext', 'items0', 'i0', 'anchor']);
    expect(body?.fn).toMatchObject({ parentNode: 'for0', anchor: 'anchor', isForBody: true });
    expect(body?.fn.precode).toContain('_iterationVariables(context, items0, i0, \'item\'');
    expect(body?.fn.precode).toContain('const { item, $index, $first, $last, $even, $odd } = vars;');
  });

  it('reads the iterable from the context when it is declared in scope', async () => {
    const { code } = await generateFor(parse('@for (item of items; track item) { <li></li> }'), 'root', '0', contextWith('items'), 'anchor');
    expect(code[0]).toContain('_for(root, context, anchor, () => context.get(\'items\'),');
  });

  it('resolves every identifier of the iterable expression', async () => {
    const { code } = await generateFor(parse('@for (child of item.children(); track child) { <li></li> }'), 'root', '0', contextWith('item'), null);
    expect(code[0]).toContain('() => context.get(\'item\').children(),');
  });

  it.each([
    ['10', '10'],
    ['numbers', 'this.numbers'],
    ['numbers()', 'this.numbers()']
  ])('generates a loop without item alias over %s', async (iterable, expected) => {
    const { code, functionsToProcess } = await generateFor(parse(`@for (${iterable}; track $index) { <li></li> }`), 'root', '0', new CompilerContext(), null);

    expect(code).toEqual([`_for(root, context, null, () => ${expected}, (_, $index) => $index, for0.bind(this));`]);
    expect(functionsToProcess?.get('for0')?.fn.precode).toContain('_iterationVariables(context, items0, i0, undefined, {');
    expect(functionsToProcess?.get('for0')?.fn.precode).toContain('const { $index, $first, $last, $even, $odd } = vars;');
  });

  it('applies the aliases declared for implicit variables', async () => {
    const { code, functionsToProcess } = await generateFor(parse('@for (item of items; track item; i = $index) { <li></li> }'), 'root', '0', new CompilerContext(), null);

    expect(code[0]).toContain('(item, i) => item');
    expect(functionsToProcess?.get('for0')?.fn.precode).toContain('const { item, i, $first, $last, $even, $odd } = vars;');
  });
});
