import { describe, expect, it } from 'vitest';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { ImportPathToken } from '../../../lexer/types/tokens/import-path-token.type';
import { Lexer } from '../../../lexer/lexer/lexer';
import type { Span } from '../../../types/span.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { Parser } from '../../parser/parser';
import type { ImportNode } from '../../types/nodes/import-node.type';
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
    expect(run(['foo', ' bar as baz ', 'default as D', '* as ns'])).toMatchObject({
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

  it('marks the node of an @import lazy, and only that one', () => {
    const template = '@import lazy { A } from \'./a\';\n@import { B } from \'./b\';';
    const [lazy, eager] = new Parser(template, new Lexer(template).tokenize()).parse() as ImportNode[];

    expect(lazy.lazy).toBe(true);
    expect(lazy.specifiers.map(({ local }) => local)).toEqual(['A']);
    expect('lazy' in eager).toBe(false);
  });

  it('locates the names of the specifiers and the path in the template', () => {
    const template = '@import { foo, bar as baz, default as D, * as ns } from \'./from\';';
    const [node] = new Parser(template, new Lexer(template).tokenize()).parse() as ImportNode[];
    const text = ({ start, end }: Span) => template.slice(start, end);

    expect(node.specifiers.map(({ importedSpan, localSpan }) => [text(importedSpan), text(localSpan)])).toEqual([
      ['foo', 'foo'],
      ['bar', 'baz'],
      ['default', 'D'],
      ['*', 'ns']
    ]);
    // A path containing the `from` keyword is located after the keyword
    expect(node.pathSpan).toEqual({ start: 57, end: 63 });
    expect(text(node.pathSpan)).toBe('./from');
  });

  it('throws for an invalid specifier', () => {
    expect(() => run(['1nvalid'])).toThrow('Invalid import specifier "1nvalid".');
  });
});
