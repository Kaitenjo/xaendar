import { describe, expect, it } from 'vitest';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { AttributeToken } from '../../../lexer/types/tokens/attribute-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNodeType } from '../../types/node.enum';
import { parseAttribute } from './parse-attribute.state';

const attribute: Token = { type: TokenType.ATTRIBUTE, parts: ['disabled'], span: { start: 0, end: 8 } };

const run = (...following: Token[]) => {
  const cursor = new ParserCursor('', [attribute, ...following]);
  return parseAttribute(cursor, () => undefined, cursor.peek() as AttributeToken);
};

describe('parseAttribute', () => {
  it.each([
    ['another attribute', { type: TokenType.ATTRIBUTE, parts: ['x'], span: { start: 9, end: 10 } } as Token],
    ['a closing tag name', { type: TokenType.TAG_CLOSE_NAME, parts: ['div'], span: { start: 9, end: 12 } } as Token],
    ['an event', { type: TokenType.EVENT, parts: ['click'], span: { start: 9, end: 14 } } as Token]
  ])('treats an attribute followed by %s as a boolean attribute', (_name, next) => {
    expect(run(next)).toEqual({
      type: ASTNodeType.Attribute,
      name: 'disabled',
      value: 'true',
      span: { start: 0, end: 8 }
    });
  });

  it('parses a literal attribute value', () => {
    const node = run({ type: TokenType.ATTRIBUTE_VALUE, parts: ['abc'], span: { start: 9, end: 12 } });
    expect(node).toMatchObject({ name: 'disabled', value: 'abc', span: { start: 0, end: 12 } });
  });

  it.each([
    ['expression', TokenType.INTERPOLATION_EXPRESSION],
    ['literal', TokenType.INTERPOLATION_LITERAL]
  ])('parses an interpolated %s value', (_name, type) => {
    const node = run({ type, parts: ['value'], span: { start: 9, end: 16 } } as Token);
    expect(node).toMatchObject({
      name: 'disabled',
      value: { type: ASTNodeType.Interpolation },
      span: { start: 0, end: 16 }
    });
  });

  it('throws when the attribute is followed by an unrelated token', () => {
    expect(() => run({ type: TokenType.TAG_OPEN_END, parts: [], span: { start: 9, end: 10 } })).toThrow('Attribute value missing for disabled');
  });
});
