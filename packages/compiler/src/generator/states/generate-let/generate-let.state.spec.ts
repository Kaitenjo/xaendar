import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import { GeneratorContext } from '../../context/context';
import { generateLet } from './generate-let.state';
import type { ContextCache } from '../../../types/context-cache.type';

const cache = {} as ContextCache;

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as LetNode;

/**
 * Creates the generator context of a scope declaring the variables given, then the @let, as `declareScope` does.
 */
function declare(name: string, ...variables: string[]): GeneratorContext {
  const context = new GeneratorContext(cache);
  for (let i = 0; i < variables.length; i++) {
    context.addIdentifier(variables[i], 'variable');
  }

  context.addIdentifier(name, 'variable');
  return context;
}

describe('generateLet', () => {
  it('initializes the @let with _let, which computes it again, passing its slot, its identifier and the variables of the template it reads', async () => {
    const context = declare('total', 'item');
    context.addSignalClassField('price');

    expect(await generateLet(parse('@let total = price() * item.quantity;'), 'root', '0', context, null)).toEqual({
      code: ['_let(context, 9, 1, root$let_total, _reads0);']
    });
    expect(context.readsDeclarations).toEqual(['const _reads0 = [0];']);
    expect(context.functionDeclarations).toEqual(['function root$let_total(context) {\n  return this.price() * _read(context, 0, 8).quantity;\n}']);
  });

  it('initializes the @let with _let without identifiers when its value reads no variable of the template', async () => {
    const context = declare('label');
    context.addIdentifier('field');

    expect(await generateLet(parse('@let label = field.value + format(unit);'), 'root', '0', context, null)).toEqual({
      code: ['_let(context, 8, 0, root$let_label);']
    });
    expect(context.readsDeclarations).toEqual([]);
    expect(context.functionDeclarations).toEqual(['function root$let_label(context) {\n  return _read(context, 0, 9).value + this.format(this.unit);\n}']);
  });

  it('initializes a literal @let with its value, once, in its slot', async () => {
    expect(await generateLet(parse('@let size = 10;'), 'root', '0', declare('size'), null)).toEqual({
      code: ['context[8] = 10;']
    });
  });

  it('returns an object literal from the function of the module computing the value', async () => {
    const context = declare('options');
    context.addSignalClassField('count');

    expect((await generateLet(parse('@let options = { count: count() };'), 'root', '0', context, null)).code).toEqual(['_let(context, 8, 0, root$let_options);']);
    expect(context.functionDeclarations).toEqual(['function root$let_options(context) {\n  return ({ count: this.count() });\n}']);
  });

  it('names the function after the parent node and the @let, appending a number when the name is taken', async () => {
    const context = declare('total');
    context.addSignalClassField('count');

    expect((await generateLet(parse('@let total = count();'), 'div0', '0', context, null)).code).toEqual(['_let(context, 8, 0, div0$let_total);']);
    expect((await generateLet(parse('@let total = count();'), 'div0', '1', context, null)).code).toEqual(['_let(context, 8, 0, div0$let_total1);']);
  });
});
