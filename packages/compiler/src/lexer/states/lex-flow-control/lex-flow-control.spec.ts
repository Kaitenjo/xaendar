import { describe, expect, it } from 'vitest';
import { Lexer } from '../../lexer/lexer';
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

  it('recognises @try', () => {
    const cursor = new LexerCursor('@try {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type: TokenType.TRY }]
    });
  });

  it('recognises @catch with the name of its error, reading it as a condition', () => {
    const cursor = new LexerCursor('@catch  (error) {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{ type: TokenType.CATCH }],
      pushState: true
    });
    expect(cursor.peekMatch('(')).toBe(true);
  });

  it('recognises @catch without a name', () => {
    const cursor = new LexerCursor('@catch {');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type: TokenType.CATCH }]
    });
  });

  it.each([
    ['@defer (idle) {', TokenType.DEFER],
    ['@hydrate (idle) {', TokenType.HYDRATE],
    ['@placeholder (minimum 1s) {', TokenType.PLACEHOLDER],
    ['@loading (after 100ms) {', TokenType.LOADING]
  ])('recognises %s, reading its parameters as a condition', (source, type) => {
    const cursor = new LexerCursor(source);
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{ type }],
      pushState: true
    });
    expect(cursor.peekMatch('(')).toBe(true);
  });

  it.each([
    ['@defer {', TokenType.DEFER],
    ['@hydrate {', TokenType.HYDRATE],
    ['@loading {', TokenType.LOADING]
  ])('recognises %s without parameters, followed by its block', (source, type) => {
    const cursor = new LexerCursor(source);
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type }]
    });
  });

  it('recognises @error with or without the name of its error', () => {
    const named = new LexerCursor('@error (failure) {');
    expect(lexFlowControl(named, context)).toEqual({
      state: LexerState.FLOW_CONTROL_CONDITION,
      tokens: [{ type: TokenType.ERROR }],
      pushState: true
    });
    expect(lexFlowControl(new LexerCursor('@error {'), context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type: TokenType.ERROR }]
    });
  });

  it('recognises @render', () => {
    const cursor = new LexerCursor('@render row(item())');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.RENDER,
      tokens: [{ type: TokenType.RENDER }]
    });
    expect(cursor.peek()).toBe('r'.charCodeAt(0));
  });

  it('recognises @let', () => {
    const cursor = new LexerCursor('@let total = 1;');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.LET,
      tokens: [{ type: TokenType.LET }]
    });
    expect(cursor.peek()).toBe('t'.charCodeAt(0));
  });

  it('recognises @import', () => {
    const cursor = new LexerCursor('@import { X } from "./x"');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.IMPORT
    });
  });

  it.each([
    ['@client {', TokenType.CLIENT],
    ['@placeholder {', TokenType.PLACEHOLDER]
  ])('recognises %s, followed by its block', (source, type) => {
    const cursor = new LexerCursor(source);
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type }]
    });
  });

  it('recognises a keyword shorter than the other ones, closing the input', () => {
    const cursor = new LexerCursor('@else {}');
    expect(lexFlowControl(cursor, context)).toEqual({
      state: LexerState.FLOW_CONTROL_BLOCK,
      tokens: [{ type: TokenType.ELSE }]
    });
  });

  it('throws for an unknown keyword', () => {
    const cursor = new LexerCursor('@unknown ');
    expect(() => lexFlowControl(cursor, context)).toThrow('Unknown flow-control keyword');
  });

  it.each(['<p></p>@', '<p></p>@fo', '<p></p>@if', 'mail@a.it'])('throws for what is not a keyword, closing the input: %s', input => {
    expect(() => new Lexer(input).tokenize()).toThrow('Unknown flow-control keyword');
  });
});
