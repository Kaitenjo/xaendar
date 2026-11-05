import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TemplateError } from '../../../models/template-error/template-error.model';
import { Parser } from '../../parser/parser';
import { ASTNodeType } from '../../types/node.enum';
import type { ClientNode } from '../../types/nodes/client-node.type';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseClient', () => {
  it('parses the content of a block without a placeholder', () => {
    const template = '@client { <b></b> }';
    const [node] = parse(template) as ClientNode[];

    expect(node).toMatchObject({ type: ASTNodeType.Client, placeholder: null, span: { start: 0, end: template.length } });
    expect(node.children).toHaveLength(1);
  });

  it.each([
    ['on the same line', '@client { <b></b> } @placeholder { <i></i> }'],
    ['on another line', '@client {\n  <b></b>\n}\n@placeholder {\n  <i></i>\n}']
  ])('parses the placeholder following the block %s', (_case, template) => {
    const [node] = parse(template) as ClientNode[];

    expect(node.span).toEqual({ start: 0, end: template.length });
    expect(node.children).toHaveLength(1);
    expect(node.placeholder).toMatchObject({ type: ASTNodeType.Placeholder, span: { start: template.indexOf('@placeholder'), end: template.length } });
    expect(node.placeholder!.children).toHaveLength(1);
  });

  it('leaves what follows the placeholder to the nodes after the block', () => {
    expect(parse('@client { a } @placeholder { b } <i></i>')).toHaveLength(2);
  });

  it.each([
    ['without a @client', '<p>a</p>@placeholder { b }'],
    ['after another block', '@if (a) { b } @placeholder { c }'],
    ['after a text following the @client', '@client { a } text @placeholder { b }'],
    ['after another @placeholder', '@client { a } @placeholder { b } @placeholder { c }']
  ])('rejects a @placeholder %s', (_case, template) => {
    expect(() => parse(template)).toThrow('@placeholder must follow the block of a @client or a @defer');
  });

  it('reports a listener in the placeholder on the listener, since it would never run', () => {
    const template = '@client { a } @placeholder { <button (click)="buy()">Buy</button> }';
    let error: unknown;
    try {
      parse(template);
    } catch (thrown) {
      error = thrown;
    }

    expect(error).toBeInstanceOf(TemplateError);
    const { detail, span } = error as TemplateError;
    expect(detail).toBe('(click) never runs: the server renders a @placeholder, and the browser replaces it without running its code');
    expect(template.slice(span.start, span.end)).toBe('(click)="buy()"');
  });

  it('accepts a listener in the content', () => {
    expect(parse('@client { <button (click)="buy()"></button> } @placeholder { <p></p> }')).toHaveLength(1);
  });
});
