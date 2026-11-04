import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateLet } from './generate-let.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as LetNode;

describe('generateLet', () => {
  it('initializes the @let with a signal computing its value when the value reads a signal', async () => {
    const context = new CompilerContext();
    context.addSignalClassField('price');
    context.addIdentifier('item', 'signal');

    expect(await generateLet(parse('@let total = price() * item().quantity;'), 'root', '0', context, null)).toEqual({
      code: ['context.set(\'total\', _let(() => this.price() * context.get(\'item\')().quantity));']
    });
  });

  it('initializes the @let with its value when the value reads no signal', async () => {
    const context = new CompilerContext();
    context.addIdentifier('field');

    expect(await generateLet(parse('@let label = field.value + format(unit);'), 'root', '0', context, null)).toEqual({
      code: ['context.set(\'label\', context.get(\'field\').value + this.format(this.unit));']
    });
  });

  it('keeps an object literal as the value of the arrow function', async () => {
    const context = new CompilerContext();
    context.addSignalClassField('count');

    expect((await generateLet(parse('@let options = { count: count() };'), 'root', '0', context, null)).code).toEqual(['context.set(\'options\', _let(() => ({ count: this.count() })));']);
  });
});
