import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexDirectiveBody } from './lex-directive-body.state';

const context: LexerTransitionFunctionContext = { history: [LexerState.TAG_OPEN_NAME, LexerState.DIRECTIVE], tokens: [] };

describe('lexDirectiveBody', () => {
  it('transitions to EVENT for an event binding', () => {
    const cursor = new LexerCursor('(change)="onChange()")');
    expect(lexDirectiveBody(cursor, context)).toEqual({ state: LexerState.EVENT });
  });

  it('throws when @ does not start a conditional binding', () => {
    expect(() => lexDirectiveBody(new LexerCursor('@change="onChange()")'), context)).toThrow('events are bound with (eventName)="handler()"');
  });

  it('throws for a nested directive', () => {
    expect(() => lexDirectiveBody(new LexerCursor('@@other)'), context)).toThrow('Directives cannot be declared inside another directive');
  });

  it('transitions to FLOW_CONTROL, leaving the keyword to it, for a conditional binding', () => {
    const cursor = new LexerCursor('@if (condition) { a="b" })');
    expect(lexDirectiveBody(cursor, context)).toEqual({ state: LexerState.FLOW_CONTROL });
    expect(cursor.peek()).toBe('@'.charCodeAt(0));
  });

  it('skips whitespace between bindings', () => {
    const cursor = new LexerCursor('   display="block")');
    expect(lexDirectiveBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });

  it.each([
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r'],
    ['a line break followed by an indentation', '\r\n\t  ']
  ])('skips %s between bindings, so that a directive can span multiple lines', (_description, whitespace) => {
    const cursor = new LexerCursor(`${whitespace}display="block")`);
    expect(lexDirectiveBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
    expect(cursor.peek()).toBe('d'.charCodeAt(0));
  });

  it('closes a directive whose ) is on its own line', () => {
    const cursor = new LexerCursor('\n)');
    expect(lexDirectiveBody(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.DIRECTIVE_CLOSE }],
      popState: true
    });
  });

  it('closes the directive and returns to TAG_BODY', () => {
    const cursor = new LexerCursor(')');
    expect(lexDirectiveBody(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.DIRECTIVE_CLOSE }],
      popState: true
    });
  });

  it('closes a directive declared inside a conditional binding and returns to CONDITIONAL_BINDING_BODY', () => {
    const conditionalBindingContext: LexerTransitionFunctionContext = { history: [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK, LexerState.DIRECTIVE], tokens: [] };
    expect(lexDirectiveBody(new LexerCursor(')'), conditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('throws when the tag ends by > before the directive is closed', () => {
    expect(() => lexDirectiveBody(new LexerCursor('>'), context)).toThrow('Directive bindings must be closed by \')\'');
  });

  it('throws when the tag ends by / before the directive is closed', () => {
    expect(() => lexDirectiveBody(new LexerCursor('/>'), context)).toThrow('Directive bindings must be closed by \')\'');
  });

  it('transitions to ATTRIBUTE by default', () => {
    const cursor = new LexerCursor('display="block")');
    expect(lexDirectiveBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });
});
