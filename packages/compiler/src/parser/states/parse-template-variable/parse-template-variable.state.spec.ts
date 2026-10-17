import { describe, expect, it } from 'vitest';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { TemplateVariableToken } from '../../../lexer/types/tokens/template-variable-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { parseTemplateVariable } from './parse-template-variable.state';

/**
 * Parses the template variable of `<input #name />`, whose token holds the given name.
 */
const run = (name: string) => {
  const input = `<input #${name} />`;
  const token: TemplateVariableToken = { type: TokenType.TEMPLATE_VARIABLE, parts: [name], span: { start: 8, end: 8 + name.length } };
  const cursor = new ParserCursor(input, [token]);

  return { node: parseTemplateVariable(cursor, token), cursor };
};

describe('parseTemplateVariable', () => {
  it('parses the name, with its span and the one of the whole variable, consuming the token', () => {
    const { node, cursor } = run('field');
    expect(node).toEqual({ name: 'field', nameSpan: { start: 8, end: 13 }, span: { start: 7, end: 13 } });
    expect(cursor.getCurrentToken().index).toBe(0);
  });

  it('throws for a name that cannot name a variable, pointing to it', () => {
    expect(() => run('$$item')).toThrow(expect.objectContaining({ message: '\'$$item\' is reserved in templates: give the template variable another name.', cause: { start: 8, end: 14 } }));
  });
});
