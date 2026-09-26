import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexImport } from './lex-import.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexImport', () => {
  it('reads a comma-separated list of import specifiers', () => {
    const cursor = new LexerCursor(' { A, B }');
    const result = lexImport(cursor, context);
    expect(result.state).toBe(LexerState.IMPORT_PATH);
    expect(result.tokens?.map(t => t.parts)).toEqual([['A'], ['B']]);
    expect(result.tokens?.every(t => t.type === TokenType.IMPORT)).toBe(true);
  });

  it('throws when @import is not followed by {', () => {
    const cursor = new LexerCursor(' X');
    expect(() => lexImport(cursor, context)).toThrow('Expected { after @import');
  });

  it('preserves the spaces around the as keyword of aliased specifiers', () => {
    const cursor = new LexerCursor('{ A as B, * as ns, default   as D }');
    const result = lexImport(cursor, context);
    expect(result.tokens?.map(t => t.parts)).toEqual([['A as B'], ['* as ns'], ['default as D']]);
  });
});
