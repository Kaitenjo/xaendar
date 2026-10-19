import { describe, expect, it } from 'vitest';
import { TokenType } from '../../types/token-type.enum';
import type { Token } from '../../types/token.type';
import { expectsTemplateDeclaration } from './template-declaration.utils';

const openTag = (tagName: string): Token => ({ type: TokenType.TAG_OPEN_NAME, parts: [tagName] });

describe('expectsTemplateDeclaration', () => {
  it('expects the declaration in a <template> declaring none yet', () => {
    expect(expectsTemplateDeclaration([openTag('div'), openTag('template')])).toBe(true);
  });

  it('expects no declaration once the <template> declares one', () => {
    expect(expectsTemplateDeclaration([openTag('template'), { type: TokenType.TEMPLATE_DECLARATION, parts: ['row', ''] }])).toBe(false);
  });

  it.each([
    ['another element', [openTag('template'), { type: TokenType.TEXT, parts: ['a'] }, openTag('input')]],
    ['no opening tag', []]
  ])('expects no declaration in %s', (_description, tokens) => {
    expect(expectsTemplateDeclaration(tokens as Token[])).toBe(false);
  });
});
