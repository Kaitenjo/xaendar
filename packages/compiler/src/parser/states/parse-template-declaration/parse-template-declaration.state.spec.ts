import { describe, expect, it } from 'vitest';
import { TokenType } from '../../../lexer/types/token-type.enum';
import type { TemplateDeclarationToken } from '../../../lexer/types/tokens/template-declaration-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { parseTemplateDeclaration } from './parse-template-declaration.state';

/**
 * Parses the declaration of `<template name()>`, whose token holds the given name.
 */
const run = (name: string) => {
  const input = `<template ${name}()>`;
  const token: TemplateDeclarationToken = { type: TokenType.TEMPLATE_DECLARATION, parts: [name, ''], span: { start: 10, end: 12 + name.length } };
  const cursor = new ParserCursor(input, [token]);

  return { node: parseTemplateDeclaration(cursor, token), cursor };
};

describe('parseTemplateDeclaration', () => {
  it('parses the name with its span, consuming the token', () => {
    const { node, cursor } = run('row');
    expect(node).toEqual({ name: 'row', nameSpan: { start: 10, end: 13 } });
    expect(cursor.getCurrentToken().index).toBe(0);
  });

  it('throws for a name that cannot name a template, pointing to it', () => {
    expect(() => run('$$row')).toThrow(expect.objectContaining({ message: '\'$$row\' is reserved in templates: give the template another name.', cause: { start: 10, end: 15 } }));
  });
});
