import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexConditionalBindingBody } from './lex-conditional-binding-body.state';

const context: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK],
  tokens: []
};
const nestedConditionalBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME, LexerState.FLOW_CONTROL_BLOCK, LexerState.FLOW_CONTROL_BLOCK],
  tokens: []
};
const directiveConditionalBindingContext: LexerTransitionFunctionContext = {
  history: [LexerState.TAG_OPEN_NAME, LexerState.DIRECTIVE, LexerState.FLOW_CONTROL_BLOCK],
  tokens: []
};

describe('lexConditionalBindingBody', () => {
  it('throws when @ starts neither a conditional binding nor a directive', () => {
    expect(() => lexConditionalBindingBody(new LexerCursor('@click="onClick()" }'), context)).toThrow('events are bound with (eventName)="handler()"');
  });

  it('transitions to EVENT for a ( binding', () => {
    const cursor = new LexerCursor('(click)="onClick()" }');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.EVENT });
  });

  it.each([
    ['a nested conditional binding', '@if (nested()) { other } }'],
    ['the branch following a nested conditional binding', '@else { other } }'],
    ['a branch of a switch', '@case (1) { other } }']
  ])('transitions to FLOW_CONTROL, leaving the keyword to it, for %s', (_description, input) => {
    const cursor = new LexerCursor(input);
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.FLOW_CONTROL });
    expect(cursor.peek()).toBe('@'.charCodeAt(0));
  });

  it('transitions to DIRECTIVE and consumes "@@" for a directive applied inside the conditional binding', () => {
    const cursor = new LexerCursor('@@myDirective }');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.DIRECTIVE });
    expect(cursor.peek()).toBe('m'.charCodeAt(0));
  });

  it('throws for a directive declared in a conditional binding belonging to another directive', () => {
    expect(() => lexConditionalBindingBody(new LexerCursor('@@other }'), directiveConditionalBindingContext)).toThrow('Directives cannot be declared inside another directive');
  });

  it('skips whitespace between bindings', () => {
    const cursor = new LexerCursor('   placeholder="{value}" }');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });

  it.each([
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r'],
    ['a line break followed by an indentation', '\r\n\t  ']
  ])('skips %s between bindings, so that a block can span multiple lines', (_description, whitespace) => {
    const cursor = new LexerCursor(`${whitespace}placeholder="{value}" }`);
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
    expect(cursor.peek()).toBe('p'.charCodeAt(0));
  });

  it('closes a block whose } is on its own line', () => {
    const cursor = new LexerCursor('\n}');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.BLOCK_CLOSE }],
      popState: true
    });
  });

  it('closes the block and returns to TAG_BODY', () => {
    const cursor = new LexerCursor('}');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({
      state: LexerState.TAG_BODY,
      tokens: [{ type: TokenType.BLOCK_CLOSE }],
      popState: true
    });
  });

  it('closes a nested block and returns to CONDITIONAL_BINDING_BODY', () => {
    const cursor = new LexerCursor('}');
    expect(lexConditionalBindingBody(cursor, nestedConditionalBindingContext).state).toBe(LexerState.CONDITIONAL_BINDING_BODY);
  });

  it('closes a block declared inside a directive and returns to DIRECTIVE_BODY', () => {
    const cursor = new LexerCursor('}');
    expect(lexConditionalBindingBody(cursor, directiveConditionalBindingContext).state).toBe(LexerState.DIRECTIVE_BODY);
  });

  it('throws when the tag ends by > before the block is closed', () => {
    expect(() => lexConditionalBindingBody(new LexerCursor('>'), context)).toThrow('Conditional binding blocks must be closed by \'}\'');
  });

  it('throws when the tag ends by / before the block is closed', () => {
    expect(() => lexConditionalBindingBody(new LexerCursor('/>'), context)).toThrow('Conditional binding blocks must be closed by \'}\'');
  });

  it('transitions to ATTRIBUTE by default', () => {
    const cursor = new LexerCursor('placeholder="{value}" }');
    expect(lexConditionalBindingBody(cursor, context)).toEqual({ state: LexerState.ATTRIBUTE });
  });
});
