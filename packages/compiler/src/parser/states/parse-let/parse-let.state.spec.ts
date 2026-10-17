import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { LET_SYNTAX_ERROR } from '../../../lexer/states/lex-let/lex-let.state';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import type { LetNode } from '../../types/nodes/let-node.type';
import { getTemplateSpan } from '../../utils/expression-validator/expression-validator';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseLet', () => {
  it('parses the name and the value, with their spans in the template', () => {
    const template = '<p>a</p>@let total = price()\n  * quantity() ;<p>c</p>';
    const [, node] = parse(template) as LetNode[];
    expect(node).toMatchObject({
      type: ASTNodeType.Let,
      name: 'total',
      nameSpan: { start: template.indexOf('total'), end: template.indexOf('total') + 5 },
      span: { start: template.indexOf('@let'), end: template.indexOf(';') + 1 }
    });
    expect(node.value.getText()).toBe('price()\n  * quantity()');
    expect(getTemplateSpan(node.value)).toEqual({ start: template.indexOf('price'), end: template.indexOf(') ;') + 1 });
  });

  it('throws when the template ends before the semicolon', () => {
    expect(() => parse('@let total = 1')).toThrow(LET_SYNTAX_ERROR);
  });

  it('throws when the value is missing, pointing to the declaration', () => {
    const template = '@let total = ;';
    expect(() => parse(template)).toThrow(LET_SYNTAX_ERROR);
    expect(() => parse(template)).toThrow(expect.objectContaining({ span: { start: 5, end: 14 } }));
  });

  it.each([
    ['is not an identifier', '@let 2total = 1;', '\'2total\' is not a valid name for a @let: it must be an identifier.'],
    ['is reserved', '@let root = 1;', '\'root\' is reserved in templates: give the @let another name.']
  ])('throws when the name %s, pointing to it', (_description, template, message) => {
    expect(() => parse(template)).toThrow(message);
    expect(() => parse(template)).toThrow(expect.objectContaining({ span: { start: 5, end: template.indexOf(' =') } }));
  });

  it('throws for a value that is not a valid template expression', () => {
    expect(() => parse('@let total = (count = 1);')).toThrow('Assignment');
  });
});
