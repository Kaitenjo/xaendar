import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import type { DeferNode } from '../../../parser/types/nodes/defer-node.type';
import { TypeCheckContext } from '../../models/context/context';
import { ProcessNode } from '../../types/type-checker-process-node.type';
import { typeCheckDefer } from './type-check-defer.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as DeferNode;
const processNode: ProcessNode = () => [{ text: 'child;' }];

describe('typeCheckDefer', () => {
  it('checks the when trigger as a condition, then each block as a scope, the @error as a catch with its name mapped onto the template', () => {
    const template = '@defer (idle, when ready()) { <input #field /> } @placeholder { a } @loading { b } @error (failure) { c }';
    const lines = typeCheckDefer(parse(template), processNode, new TypeCheckContext());

    expect(lines.map(({ text }) => text)).toEqual([
      'if (root.ready()) { }',
      '{',
      '  let field!: (HTMLElementTagNameMap extends { \'input\': infer Type } ? Type : HTMLElement);',
      '  child;',
      '}',
      '{',
      '  child;',
      '}',
      '{',
      '  child;',
      '}',
      'try { }',
      'catch (failure) {',
      '  child;',
      '}'
    ]);

    const [{ columnStart, columnEnd, original }] = lines[12].mappings!;
    expect(template.slice(original.start, original.end)).toBe('failure');
    expect(lines[12].text.slice(columnStart, columnEnd)).toBe('failure');
  });

  it('checks only the content of a @defer without the blocks following it, and an @error without a name as a catch without a binding', () => {
    expect(typeCheckDefer(parse('@defer (idle) { a }'), processNode, new TypeCheckContext()).map(({ text }) => text)).toEqual(['{', '  child;', '}']);
    expect(typeCheckDefer(parse('@defer (idle) { a } @error { b }'), processNode, new TypeCheckContext()).map(({ text }) => text)).toEqual(['{', '  child;', '}', 'try { }', 'catch {', '  child;', '}']);
  });

  it('reads the error as a value of the @error, not from the component', () => {
    const contexts = new Array<TypeCheckContext>();
    const capture: ProcessNode = (_node, context) => {
      contexts.push(context);
      return [];
    };

    typeCheckDefer(parse('@defer (idle) { a } @error (failure) { b }'), capture, new TypeCheckContext());

    expect(contexts[0].hasUnresolvableIdentifier('failure')).toBe(false);
    expect(contexts[1].hasUnresolvableIdentifier('failure')).toBe(true);
  });
});
