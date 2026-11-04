import { describe, expect, it } from 'vitest';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNode } from '../../types/ast.type';
import { ASTNodeType } from '../../types/node.enum';
import { parseBlockChildren } from './parse-block-children.state';

const tokens: Token[] = [
  { type: TokenType.TEXT, parts: ['a'], span: { start: 0, end: 1 } },
  { type: TokenType.TEXT, parts: ['b'], span: { start: 1, end: 2 } },
  { type: TokenType.BLOCK_CLOSE, span: { start: 2, end: 3 } }
];

describe('parseBlockChildren', () => {
  it('collects children until BLOCK_CLOSE and consumes it', () => {
    const cursor = new ParserCursor('ab}', tokens);
    const parseNode = (): ASTNode => {
      cursor.advance();
      return { type: ASTNodeType.Text, value: 'x', span: { start: 0, end: 1 } };
    };

    expect(parseBlockChildren(cursor, parseNode)).toHaveLength(2);
    expect(cursor.getCurrentToken().value.type).toBe(TokenType.BLOCK_CLOSE);
  });

  it('skips children for which parseNode returns undefined', () => {
    const cursor = new ParserCursor('ab}', tokens);
    const parseNode = (): undefined => {
      cursor.advance();
      return undefined;
    };

    expect(parseBlockChildren(cursor, parseNode)).toEqual([]);
  });

  it('throws when the tokens end before the block is closed', () => {
    const cursor = new ParserCursor('a', [tokens[0]]);
    const parseNode = (): undefined => {
      cursor.advance();
      return undefined;
    };

    expect(() => parseBlockChildren(cursor, parseNode)).toThrow('Unexpected end of template: expected BLOCK_CLOSE');
  });
});
