import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer/lexer';
import { TokenType } from '../../lexer/types/token-type.enum';
import { Token } from '../../lexer/types/token.type';
import { TemplateError } from '../../models/template-error/template-error.model';
import { ASTNodeType } from '../types/node.enum';
import { Parser } from './parser';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('Parser', () => {
  it('parses every kind of top-level node', () => {
    const nodes = parse('@import { A } from \'./a\'\n<div></div>hello{value}');
    expect(nodes.map(n => n.type)).toEqual([
      ASTNodeType.Import,
      ASTNodeType.Element,
      ASTNodeType.Text,
      ASTNodeType.Interpolation
    ]);
  });

  it('assigns fallback spans to nodes without their own', () => {
    const [node] = parse('hello');
    expect(node.span).toEqual({ start: 0, end: 5 });
  });

  it('falls back to the token span when a state leaves the cursor before the first token', () => {
    const tokens: Token[] = [{ type: TokenType.TEXT, parts: ['a'], span: { start: 3, end: 4 } }];
    const parser = new Parser('abcd', tokens) as unknown as { _states: Record<number, unknown>, parseNode(): { span: unknown } };
    parser._states[TokenType.TEXT] = () => ({ type: ASTNodeType.Text, value: 'a' });

    expect(parser.parseNode().span).toEqual({ start: 3, end: 4 });
  });

  it('returns undefined from parseNode at the end of the token stream', () => {
    const parser = new Parser('', []) as unknown as { parseNode(): unknown };
    expect(parser.parseNode()).toBeUndefined();
  });

  it('throws for a token with no registered transition function', () => {
    expect(() => parse('<div></div></span>')).toThrow('No transition function for token of type TAG_CLOSE_NAME');
  });

  it('formats errors with the position and source excerpt', () => {
    expect(() => parse('hello {a = 1}')).toThrow(/^\[Parser\] \[Ln 1, Col \d+\] - /);
  });

  it('formats errors raised while the cursor is at the end of the stream', () => {
    const tokens: Token[] = [{ type: TokenType.TAG_OPEN_NAME, parts: ['div'], span: { start: 0, end: 4 } }];
    expect(() => new Parser('<div', tokens).parse()).toThrow('[Parser]');
  });

  it('reports the span carried by the error, or the one of the node being parsed', () => {
    const capture = (template: string): TemplateError => {
      try {
        parse(template);
      } catch (err) {
        return err as TemplateError;
      }

      throw new Error('Expected the template to fail');
    };

    // The assignment operator of the expression
    expect(capture('hello {a = 1}').span).toEqual({ start: 9, end: 10 });
    expect(capture('hello {a = 1}').detail).toBe('\'FirstAssignment\' is not allowed inside template expressions.');
    expect(capture('<div></div></span>').span).toEqual({ start: 11, end: 18 });
  });

  it('accepts the @import statements at the beginning of the template, separated by spaces and semicolons', () => {
    const nodes = parse('\n@import { A } from \'./a\';\n  @import { B } from \'./b\'\n\n<div></div>');

    expect(nodes.filter(({ type }) => type === ASTNodeType.Import)).toHaveLength(2);
  });

  it.each([
    ['text', '@import { A } from \'./a\';\nhello\n@import { B } from \'./b\';'],
    ['an element', '<p></p>\n@import { A } from \'./a\';'],
    ['an interpolation', '{ a }@import { A } from \'./a\';'],
    ['a block', '@if (a) { x }\n@import { A } from \'./a\';'],
    ['an element enclosing it', '@import { A } from \'./a\';\n<div>@import { B } from \'./b\'</div>'],
    ['a block enclosing it', '@if (a) { @import { A } from \'./a\' }']
  ])('rejects an @import statement after %s', (_name, template) => {
    expect(() => parse(template)).toThrow('An @import statement must be at the beginning of the template, before any other content');
  });

  it('does not wrap errors more than once when parsing nested nodes', () => {
    let message = '';
    try {
      parse('<div>{a = 1}</div>');
    } catch (err) {
      message = `${err}`;
    }

    expect(message.match(/\[Parser\]/g)).toHaveLength(1);
  });
});
