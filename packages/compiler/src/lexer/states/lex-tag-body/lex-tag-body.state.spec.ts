import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexTagBody } from './lex-tag-body.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexTagBody', () => {
  it('transitions to EVENT on a ( binding, leaving the ( to it', () => {
    const cursor = new LexerCursor('(click)="onClick"');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.EVENT });
    expect(cursor.peek()).toBe('('.charCodeAt(0));
  });

  it.each([
    ['the former @event syntax', '@click="onClick()"'],
    ['a keyword not followed by a space', '@if(cond()) { }'],
    ['a keyword not allowed among the bindings', '@for (item of items; track item) { }'],
    ['nothing', '@ click="onClick()"']
  ])('throws when @ starts neither a conditional binding nor a directive: %s', (_description, input) => {
    expect(() => lexTagBody(new LexerCursor(input), context)).toThrow('events are bound with (eventName)="handler()"');
  });

  it.each([
    ['@if', '@if (bind()) { other }'],
    ['@switch', '@switch (mode()) { @case (1) { other } }']
  ])('transitions to FLOW_CONTROL, leaving the keyword to it, for an %s conditional binding', (_keyword, input) => {
    const cursor = new LexerCursor(input);
    const result = lexTagBody(cursor, context);
    expect(result).toEqual({ state: LexerState.FLOW_CONTROL });
    expect(cursor.peek()).toBe('@'.charCodeAt(0));
  });

  it('transitions to EVENT for an event sharing its name with a flow-control keyword', () => {
    const cursor = new LexerCursor('(switch)="onSwitch()"');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.EVENT });
  });

  it('transitions to DIRECTIVE and consumes "@@" for a directive', () => {
    const cursor = new LexerCursor('@@myDirective(display="block")');
    const result = lexTagBody(cursor, context);
    expect(result).toEqual({ state: LexerState.DIRECTIVE });
    expect(cursor.peek()).toBe('m'.charCodeAt(0));
  });

  it('skips whitespace and keeps scanning', () => {
    const cursor = new LexerCursor('   class="a">');
    const result = lexTagBody(cursor, context);
    expect(result).toEqual({ state: LexerState.ATTRIBUTE });
  });

  it.each([
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r'],
    ['a line break followed by an indentation', '\r\n\t  ']
  ])('skips %s and keeps scanning, so that a tag can span multiple lines', (_description, whitespace) => {
    const cursor = new LexerCursor(`${whitespace}class="a">`);
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
    expect(cursor.peek()).toBe('c'.charCodeAt(0));
  });

  it('reaches the end of a tag closed on its own line', () => {
    const cursor = new LexerCursor('\n>');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.TAG_OPEN_END, popState: true });
  });

  it('transitions to TAG_OPEN_END and pops state on >', () => {
    const cursor = new LexerCursor('>');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.TAG_OPEN_END, popState: true });
  });

  it('transitions to TAG_OPEN_END and pops state on /', () => {
    const cursor = new LexerCursor('/>');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.TAG_OPEN_END, popState: true });
  });

  it('transitions to ATTRIBUTE by default', () => {
    const cursor = new LexerCursor('disabled>');
    expect(lexTagBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });
});
