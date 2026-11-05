import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { TryNode } from '../../../parser/types/nodes/try-node.type';
import { TypeCheckContext } from '../../models/type-checker-context/type-checker-context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckTry } from './type-check-try.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as TryNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];

describe('typeCheckTry', () => {
  it('checks the content and the @catch as a try and a catch, the name of the error mapped onto the template', () => {
    const template = '@try { <input #field /> } @catch (failure) { <input #field /> }';
    const lines = typeCheckTry(parse(template), processNode, new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual([
      'try {',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '} catch (failure) {',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '}'
    ]);

    const [{ columnStart, columnEnd, original }] = lines[3].mappings!;
    expect(template.slice(original.start, original.end)).toBe('failure');
    expect(lines[3].text.slice(columnStart, columnEnd)).toBe('failure');
  });

  it('checks a @catch without a name as a catch without a binding', () => {
    const lines = typeCheckTry(parse('@try { a } @catch { b }'), processNode, new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual(['try {', '  child;', '} catch {', '  child;', '}']);
  });

  it('reads the error as a value of the @catch, not from the component', () => {
    const contexts = new Array<TypeCheckContext>();
    const capture: ProcessNode = (_node, context) => {
      contexts.push(context);
      return [];
    };

    typeCheckTry(parse('@try { a } @catch (failure) { b }'), capture, new TypeCheckContext());

    expect(contexts[0].hasUnresolvableIdentifier('failure')).toBe(false);
    expect(contexts[1].hasUnresolvableIdentifier('failure')).toBe(true);
  });
});
