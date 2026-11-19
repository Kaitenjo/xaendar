import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { Parser } from '../../parser/parser';
import { SwitchNode } from '../../types/nodes/switch-node.type';
import type { Span } from '../../../types/span.type';
import { getTemplateSpan } from '../../utils/expression-validator/expression-validator';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse();

describe('parseSwitchControlFlow', () => {
  it('parses cases, grouped cases and default', () => {
    const [node] = parse('@switch (x) { @case (1) { <a></a> } @case (2) @case (3) { <b></b> } @default { <c></c> } }') as SwitchNode[];

    expect(node.children.map(c => c.condition)).toEqual([['1'], ['2', '3'], null]);
    expect(node.children.every(c => c.children.length === 1)).toBe(true);
  });

  it('throws when the switch condition is missing', () => {
    const tokens: Token[] = [{ type: TokenType.SWITCH, span: { start: 0, end: 6 } }];
    expect(() => new Parser('', tokens).parse()).toThrow('Expected CONDITION after SWITCH, got EOF');
  });

  it('throws when a case has no condition', () => {
    const tokens: Token[] = [
      { type: TokenType.SWITCH, span: { start: 0, end: 6 } },
      { type: TokenType.CONDITION, parts: ['x'], span: { start: 6, end: 9 } },
      { type: TokenType.BLOCK_OPEN, span: { start: 9, end: 10 } },
      { type: TokenType.CASE, span: { start: 10, end: 14 } },
      { type: TokenType.BLOCK_OPEN, span: { start: 14, end: 15 } }
    ];
    expect(() => new Parser('', tokens).parse()).toThrow('Expected CONDITION after CASE');
  });

  it('throws when a case condition is not followed by BLOCK_OPEN', () => {
    const tokens: Token[] = [
      { type: TokenType.SWITCH, span: { start: 0, end: 6 } },
      { type: TokenType.CONDITION, parts: ['x'], span: { start: 6, end: 9 } },
      { type: TokenType.BLOCK_OPEN, span: { start: 9, end: 10 } },
      { type: TokenType.CASE, span: { start: 10, end: 14 } },
      { type: TokenType.CONDITION, parts: ['1'], span: { start: 14, end: 17 } }
    ];
    expect(() => new Parser('', tokens).parse()).toThrow('Expected BLOCK_OPEN after CASE condition');
  });

  it('throws on unexpected tokens and on EOF inside the switch instead of looping', () => {
    const head: Token[] = [
      { type: TokenType.SWITCH, span: { start: 0, end: 6 } },
      { type: TokenType.CONDITION, parts: ['x'], span: { start: 6, end: 9 } },
      { type: TokenType.BLOCK_OPEN, span: { start: 9, end: 10 } }
    ];
    const text: Token = { type: TokenType.TEXT, parts: ['a'], span: { start: 10, end: 11 } };

    expect(() => new Parser('', [...head, text]).parse()).toThrow('Unexpected TEXT inside SWITCH, expected CASE or DEFAULT');
    expect(() => new Parser('', head).parse()).toThrow('Unexpected EOF inside SWITCH, expected CASE or DEFAULT');
  });

  it('throws on a second @default, on its keyword, while a case may follow the @default', () => {
    const template = '@switch (x) { @default { a } @default { b } }';

    expect(() => parse(template)).toThrow(expect.objectContaining({ detail: 'A @switch can declare only one @default', span: { start: 29, end: 38 } }));
    expect((parse('@switch (x) { @default { a } @case (1) { b } }') as SwitchNode[])[0].children.map(({ condition }) => condition)).toEqual([null, ['1']]);
  });

  it('keeps @default never; as the span of an exhaustive switch, declaring no case', () => {
    const template = '@switch (x) { @case (1) { a } @default never; }';
    const [node] = parse(template) as SwitchNode[];

    expect(node.children.map(({ condition }) => condition)).toEqual([['1']]);
    expect(node.exhaustive).toEqual({ start: template.indexOf('@default'), end: template.indexOf(';') + 1 });
    expect((parse('@switch (x) { @case (1) { a } }') as SwitchNode[])[0]).not.toHaveProperty('exhaustive');
  });

  it.each([
    ['after a @default branch', '@switch (x) { @default { a } @default never; }', '@default never;'],
    ['before a @default branch', '@switch (x) { @default never; @default { a } }', '@default {']
  ])('throws on @default never; %s', (_description, template, located) => {
    const start = template.indexOf(located);
    expect(() => parse(template)).toThrow(expect.objectContaining({
      detail: '@default never; cannot be declared with a @default branch: it states that the @case branches cover every value of the @switch',
      span: { start, end: start + (located === '@default never;' ? located.length : '@default '.length) }
    }));
  });

  it('throws on @default never; followed by a case', () => {
    expect(() => parse('@switch (x) { @default never; @case (1) { a } }')).toThrow('@default never; must be the last item of a @switch');
  });

  it('locates the expression and the case conditions in the template', () => {
    const template = '@switch (kind()) { @case (\'a\') @case (Kind.B) { x } @default { y } }';
    const [node] = parse(template) as SwitchNode[];
    const textOf = (template: string, span: Span | undefined) => span && template.slice(span.start, span.end);

    expect(textOf(template, getTemplateSpan(node.expression))).toBe('kind()');
    expect(node.children[0].conditionSpans.map(span => textOf(template, span))).toEqual(['\'a\'', 'Kind.B']);
    expect(node.children[1].conditionSpans).toEqual([]);
  });
});
