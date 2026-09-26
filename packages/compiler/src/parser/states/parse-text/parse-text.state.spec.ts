import { describe, expect, it } from 'vitest';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { TextToken } from '../../../lexer/types/tokens/text-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNodeType } from '../../types/node.enum';
import { parseText } from './parse-text.state';

describe('parseText', () => {
  it('produces a Text node and advances the cursor', () => {
    const token: TextToken = { type: TokenType.TEXT, parts: ['hello'], span: { start: 0, end: 5 } };
    const cursor = new ParserCursor('hello', [token]);

    expect(parseText(cursor, () => undefined, token)).toEqual({ type: ASTNodeType.Text, value: 'hello' });
    expect(cursor.getCurrentToken().value).toBe(token);
  });
});
