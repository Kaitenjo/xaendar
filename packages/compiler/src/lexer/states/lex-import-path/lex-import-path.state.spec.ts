import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexImportPath } from './lex-import-path.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexImportPath', () => {
  it('reads a single-quoted import path', () => {
    const cursor = new LexerCursor('  from \'./path\'');
    expect(lexImportPath(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.IMPORT_PATH, parts: ['./path'] }]
    });
  });

  it('reads a double-quoted import path', () => {
    const cursor = new LexerCursor('from "./path"');
    expect(lexImportPath(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.IMPORT_PATH, parts: ['./path'] }]
    });
  });

  it.each([
    ['right after the path', 'from \'./path\';\n<p />'],
    ['after spaces and tabs', 'from "./path" \t;\n<p />']
  ])('consumes the semicolon closing the statement %s, which is not a text of the template', (_description, input) => {
    const cursor = new LexerCursor(input);
    expect(lexImportPath(cursor, context)).toEqual({
      state: LexerState.TEXT,
      tokens: [{ type: TokenType.IMPORT_PATH, parts: ['./path'] }]
    });
    expect(cursor.peek()).toBe('\n'.charCodeAt(0));
  });

  it('leaves a semicolon on another line to the template', () => {
    const cursor = new LexerCursor('from \'./path\'\n;');
    lexImportPath(cursor, context);
    expect(cursor.peek()).toBe('\n'.charCodeAt(0));
  });

  it('throws when the from keyword is missing', () => {
    const cursor = new LexerCursor(' nofrom');
    expect(() => lexImportPath(cursor, context)).toThrow('Expected \'from\' keyword after import list');
  });

  it('throws when the path is not wrapped in quotes', () => {
    const cursor = new LexerCursor('from x');
    expect(() => lexImportPath(cursor, context)).toThrow('Import statement must start with \' or ".\nFound character x');
  });
});
