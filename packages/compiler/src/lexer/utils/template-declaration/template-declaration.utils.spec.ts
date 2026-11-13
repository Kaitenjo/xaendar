import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { TokenType } from '../../types/token-type.enum';
import type { Token } from '../../types/token.type';
import { expectsTemplateDeclaration } from './template-declaration.utils';

const openTag = (tagName: string): Token => ({ type: TokenType.TAG_OPEN_NAME, parts: [tagName], span: { start: 0, end: 0 } });

describe('expectsTemplateDeclaration', () => {
  it('expects the declaration in a <template> declaring none yet, before a name followed by its parameters', () => {
    expect(expectsTemplateDeclaration([openTag('div'), openTag('template')], new LexerCursor('row(item: Item)>'))).toBe(true);
  });

  it.each([
    ['an attribute with a value', 'id="row">'],
    ['a boolean attribute', 'row>'],
    ['a name followed by a space', 'row (item)>']
  ])('expects no declaration in a <template> before %s, an attribute of a standard <template>', (_description, input) => {
    expect(expectsTemplateDeclaration([openTag('template')], new LexerCursor(input))).toBe(false);
  });

  it('expects no declaration once the <template> declares one', () => {
    expect(expectsTemplateDeclaration([openTag('template'), { type: TokenType.TEMPLATE_DECLARATION, parts: ['row', ''], span: { start: 0, end: 0 } }], new LexerCursor('other()>'))).toBe(false);
  });

  it.each([
    ['another element', [openTag('template'), { type: TokenType.TEXT, parts: ['a'] }, openTag('input')]],
    ['no opening tag', []]
  ])('expects no declaration in %s', (_description, tokens) => {
    expect(expectsTemplateDeclaration(tokens as Token[], new LexerCursor('row()>'))).toBe(false);
  });
});
