import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexTemplateVariable } from './lex-template-variable.state';

/**
 * Creates the context of the body of the opening tag of an element.
 */
const tagContext = (tagName: string): LexerTransitionFunctionContext => ({
  history: [LexerState.TAG_OPEN_NAME],
  tokens: [{ type: TokenType.TAG_OPEN_NAME, parts: [tagName], span: { start: 0, end: tagName.length + 1 } }]
});

const inputContext = tagContext('input');
const templateContext = tagContext('template');

/**
 * Creates a cursor positioned right after the `#` of the given input, as the tag body leaves it.
 */
function afterHash(input: string): LexerCursor {
  const cursor = new LexerCursor(input);
  cursor.advance();
  return cursor;
}

describe('lexTemplateVariable', () => {
  it.each([
    ['a space', ' '],
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r'],
    ['>', '>'],
    ['/', '/']
  ])('emits the variable and goes back to TAG_BODY on %s, leaving it to the tag body', (_description, next) => {
    const cursor = afterHash(`#name${next}type="text"`);
    expect(lexTemplateVariable(cursor, inputContext)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.TEMPLATE_VARIABLE, parts: ['name'] }]
    });
    expect(cursor.peek()).toBe(next.charCodeAt(0));
  });

  it('reads the parameters a <template> declares, up to the parenthesis closing them', () => {
    const cursor = afterHash('#row(item: Item, render: (value: \')\') => void) >');
    expect(lexTemplateVariable(cursor, templateContext)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.TEMPLATE_VARIABLE, parts: ['row', 'item: Item, render: (value: \')\') => void'] }]
    });
    expect(cursor.peek()).toBe(' '.charCodeAt(0));
  });

  it('reads empty parameters as an empty text, telling them from no parameters at all', () => {
    expect(lexTemplateVariable(afterHash('#empty()>'), templateContext).tokens).toEqual([{ type: TokenType.TEMPLATE_VARIABLE, parts: ['empty', ''] }]);
  });

  it.each([
    ['another element', inputContext],
    ['no opening tag', { history: [], tokens: [] }]
  ])('throws for parameters declared on %s', (_description, context) => {
    expect(() => lexTemplateVariable(afterHash('#name(value: number)>'), context)).toThrow('Only a <template> declares parameters');
  });

  it('throws for parameters declared twice', () => {
    expect(() => lexTemplateVariable(afterHash('#row()(item: Item)>'), templateContext)).toThrow('A template declares its parameters only once');
  });

  it('throws for parameters not followed by a whitespace, / or >', () => {
    expect(() => lexTemplateVariable(afterHash('#row()class="a">'), templateContext)).toThrow('The parameters of a template must be followed by a whitespace, / or >');
  });

  it('throws for a variable given a value', () => {
    expect(() => lexTemplateVariable(afterHash('#name="field">'), inputContext)).toThrow('A template variable takes no value');
  });

  it.each([
    ['followed by a space', '# type="text"', inputContext],
    ['followed by parameters', '#(item: Item)>', templateContext]
  ])('throws for a variable without a name, %s', (_description, input, context) => {
    expect(() => lexTemplateVariable(afterHash(input), context)).toThrow('A template variable needs a name');
  });
});
