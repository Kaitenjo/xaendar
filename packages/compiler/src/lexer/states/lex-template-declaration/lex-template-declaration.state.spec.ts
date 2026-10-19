import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexTemplateDeclaration } from './lex-template-declaration.state';

const context: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME],
  tokens: [{ type: TokenType.TAG_OPEN_NAME, parts: ['template'], span: { start: 0, end: 9 } }]
};

describe('lexTemplateDeclaration', () => {
  it.each([
    ['a space', ' '],
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r'],
    ['>', '>'],
    ['/', '/']
  ])('emits the declaration and goes back to TAG_BODY on %s, leaving it to the tag body', (_description, next) => {
    const cursor = new LexerCursor(`row(item: Item)${next}`);
    expect(lexTemplateDeclaration(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.TEMPLATE_DECLARATION, parts: ['row', 'item: Item'] }]
    });
    expect(cursor.peek()).toBe(next.charCodeAt(0));
  });

  it('reads the parameters up to the parenthesis closing them', () => {
    const cursor = new LexerCursor('row(item: Item, render: (value: \')\') => void) >');
    expect(lexTemplateDeclaration(cursor, context).tokens).toEqual([{ type: TokenType.TEMPLATE_DECLARATION, parts: ['row', 'item: Item, render: (value: \')\') => void'] }]);
  });

  it('reads empty parameters as an empty text, telling them from no parameters at all', () => {
    expect(lexTemplateDeclaration(new LexerCursor('empty()>'), context).tokens).toEqual([{ type: TokenType.TEMPLATE_DECLARATION, parts: ['empty', ''] }]);
    expect(lexTemplateDeclaration(new LexerCursor('row>'), context).tokens).toEqual([{ type: TokenType.TEMPLATE_DECLARATION, parts: ['row'] }]);
  });

  it('throws for parameters declared twice', () => {
    expect(() => lexTemplateDeclaration(new LexerCursor('row()(item: Item)>'), context)).toThrow('A template declares its parameters only once');
  });

  it('throws for parameters not followed by a whitespace, / or >', () => {
    expect(() => lexTemplateDeclaration(new LexerCursor('row()class="a">'), context)).toThrow('The parameters of a template must be followed by a whitespace, / or >');
  });

  it('throws for an attribute given a value', () => {
    expect(() => lexTemplateDeclaration(new LexerCursor('class="a">'), context)).toThrow('A <template> declares only its name and its parameters');
  });
});
