import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { LetNode } from '../../../parser/types/nodes/let-node.type';
import { TypeCheckContext } from '../../models/context/context';
import { typeCheckLet } from './type-check-let.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as LetNode;

describe('typeCheckLet', () => {
  it('checks the value in a constant, mapped onto the value, reading the members through root', () => {
    const template = '@let label = field.value + unit;';
    const context = new TypeCheckContext();
    context.addUnresolvableIdentifier('field');
    const [line] = typeCheckLet(parse(template), () => [], context);

    expect(line.text).toBe('const __let0 = field.value + root.unit;');
    expect(line.mappings).toEqual(expect.arrayContaining([
      { columnStart: 15, columnEnd: 38, original: { start: template.indexOf('field'), end: template.indexOf(';') } }
    ]));
    expect(context.usesTemplateHelpers).toBe(false);
  });

  it('checks a value reading a signal or a variable of the template the same way, typing the @let with the value', () => {
    const context = new TypeCheckContext();
    context.addSignalClassField('price');
    context.addUnresolvableIdentifier('item', 'variable');

    expect(typeCheckLet(parse('@let total = item.count * price();'), () => [], context)[0].text).toBe('const __let0 = item.count * root.price();');
    expect(context.usesTemplateHelpers).toBe(false);
  });
});
