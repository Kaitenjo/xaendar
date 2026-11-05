import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { TemplateError } from '../../../models/template-error/template-error.model';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import type { DeferNode } from '../../types/nodes/defer-node.type';
import { parseDefer } from './parse-defer.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

/**
 * The error of a template, as its message and the text of the template it points to.
 */
const failure = (template: string) => {
  try {
    parse(template);
  } catch (error) {
    const { detail, span } = error as TemplateError;
    return [detail, template.slice(span.start, span.end)];
  }

  return undefined;
};

describe('parseDefer', () => {
  it('parses the triggers and the content, without the blocks following it', () => {
    const template = '@defer (idle, when ready()) { <b></b> } <i></i>';
    const [node, after] = parse(template) as DeferNode[];

    expect(node).toMatchObject({ type: ASTNodeType.Defer, placeholder: null, loading: null, error: null, span: { start: 0, end: template.indexOf('}') + 1 } });
    expect(node.triggers.map(({ kind }) => kind)).toEqual(['idle', 'when']);
    expect(node.children).toHaveLength(1);
    expect(after.type).toBe(ASTNodeType.Element);
  });

  it.each([
    ['in order', '@defer (idle) { a } @placeholder { b } @loading { c } @error (failure) { d }'],
    ['in any order, on other lines', '@defer (idle) {\n  a\n}\n@error (failure) {\n  d\n}\n@loading {\n  c\n}\n@placeholder {\n  b\n}']
  ])('parses the @placeholder, the @loading and the @error following it %s', (_case, template) => {
    const [node] = parse(template) as DeferNode[];

    expect(node.span).toEqual({ start: 0, end: template.length });
    expect(node.placeholder).toMatchObject({ type: ASTNodeType.Placeholder, children: [{ type: ASTNodeType.Text }], span: { start: template.indexOf('@placeholder') } });
    expect(node.loading).toMatchObject({ type: ASTNodeType.Loading, children: [{ type: ASTNodeType.Text }], span: { start: template.indexOf('@loading') } });
    expect(node.error).toMatchObject({ type: ASTNodeType.Error, name: 'failure', children: [{ type: ASTNodeType.Text }], span: { start: template.indexOf('@error') } });
    expect(template.slice(node.error!.nameSpan!.start, node.error!.nameSpan!.end)).toBe('failure');
  });

  it('parses an @error without a name', () => {
    const [node] = parse('@defer (idle) { a } @error { b }') as DeferNode[];

    expect(node.error).not.toHaveProperty('name');
    expect(node.error!.children).toHaveLength(1);
  });

  it.each([
    ['@placeholder', '@defer (idle) { a } @placeholder { b } @loading { c } @placeholder { d }'],
    ['@loading', '@defer (idle) { a } @loading { b } @loading { c }'],
    ['@error', '@defer (idle) { a } @error { b } @error (failure) { c }']
  ])('rejects %s declared twice, on its second keyword', (keyword, template) => {
    expect(failure(template)).toEqual([`${keyword} is declared twice for this @defer`, `${keyword} `]);
  });

  it('rejects a name of the error a template cannot declare', () => {
    expect(failure('@defer (idle) { a } @error ($event) { b }')).toEqual(['\'$event\' is reserved in templates: give the error of @error another name.', '$event']);
  });

  it('rejects the trigger never, on the trigger', () => {
    expect(failure('@defer (never) { a }')).toEqual(['Unknown @defer trigger "never": use load, idle, visible, interaction, or when followed by an expression', 'never']);
  });

  it('rejects a keyword without its triggers', () => {
    const template = '@defer (idle) { a }';
    const tokens = new Lexer(template).tokenize().filter(token => token.type !== TokenType.CONDITION);

    expect(() => parseDefer(new ParserCursor(template, tokens), () => undefined, tokens[0] as never)).toThrow('Expected the triggers of @defer between parentheses, got BLOCK_OPEN');
  });

  it.each([
    ['@loading', '<p>a</p>@loading { b }', '@loading must follow the block of a @defer'],
    ['@error', '@if (a) { b } @error { c }', '@error must follow the block of a @defer'],
    ['@placeholder', '@try { a } @catch { b } @placeholder { c }', '@placeholder must follow the block of a @client or a @defer']
  ])('rejects %s not following a @defer', (_keyword, template, message) => {
    expect(failure(template)?.[0]).toBe(message);
  });
});
