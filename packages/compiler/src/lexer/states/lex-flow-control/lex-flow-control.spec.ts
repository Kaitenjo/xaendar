import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexFlowControl } from './lex-flow-control';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexFlowControl', () => {
  it('recognises @for', () => {
    const cursor = new LexerCursor('@for (x of y) {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{ type: TokenType.FOR }],
      pushState: true
    });
  });

  it('recognises @if', () => {
    const cursor = new LexerCursor('@if (x) {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{ type: TokenType.IF }],
      pushState: true
    });
  });

  it('recognises @else if', () => {
    const cursor = new LexerCursor('@else if (x) {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{ type: TokenType.ELSE_IF }],
      pushState: true
    });
  });

  it('recognises @else', () => {
    const cursor = new LexerCursor('@else {zzzzzzzz');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type: TokenType.ELSE }]
    });
  });

  it('recognises @switch', () => {
    const cursor = new LexerCursor('@switch (x) {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{ type: TokenType.SWITCH }],
      pushState: true
    });
  });

  it('recognises @case', () => {
    const cursor = new LexerCursor('@case (x) {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.CASE_FLOW_CONTROL_CONDITION,
      tokens: [{ type: TokenType.CASE }],
      pushState: true
    });
  });

  it('recognises @default', () => {
    const cursor = new LexerCursor('@default {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type: TokenType.DEFAULT }]
    });
  });

  it('recognises @import', () => {
    const cursor = new LexerCursor('@import { X } from "./x"');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.IMPORT
    });
  });

  it('throws for an unknown keyword', () => {
    const cursor = new LexerCursor('@unknown ');
    expect(() => lexFlowControl(cursor, context)).toThrow('Unknown flow-control keyword');
  });
});
