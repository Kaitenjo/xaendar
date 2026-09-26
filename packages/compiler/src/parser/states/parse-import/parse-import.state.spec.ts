import { describe, expect, it } from 'vitest';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { ImportPathToken } from '../../../lexer/types/tokens/import-path-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNodeType } from '../../types/node.enum';
import { parseImport } from './parse-import.state';

const run = (specifiers: string[]) => {
  const tokens: Token[] = [
    ...specifiers.map<Token>((s, i) => ({ type: TokenType.IMPORT, parts: [s], span: { start: i, end: i + 1 } })),
    { type: TokenType.IMPORT_PATH, parts: ['./x'], span: { start: 90, end: 95 } }
  ];
  const cursor = new ParserCursor('', tokens);
  return parseImport(cursor, () => undefined, cursor.peek() as ImportPathToken);
};

describe('parseImport', () => {
  it('parses named, aliased, default and namespace specifiers', () => {
    expect(run(['foo', ' bar as baz ', 'default as D', '* as ns'])).toEqual({
      type: ASTNodeType.Import,
      specifiers: [
        { imported: 'foo', local: 'foo' },
        { imported: 'bar', local: 'baz' },
        { imported: 'default', local: 'D' },
        { imported: '*', local: 'ns' }
      ],
      path: './x'
    });
  });

  it('throws for an invalid specifier', () => {
    expect(() => run(['1nvalid'])).toThrow('Invalid import specifier "1nvalid".');
  });
});
