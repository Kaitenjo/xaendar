import { describe, expect, it } from 'vitest';
import { LexerCursor } from '../../types/lexer-cursor/lexer-cursor.model';
import { LexerState } from '../../types/lexer-state.enum';
import { TokenType } from '../../types/token-type.enum';
import { Token } from '../../types/token.type';
import { LexerTransitionFunctionContext } from '../../types/transition-function/transition-function-context.type';
import { lexEvent } from './lex-event.state';

const context: LexerTransitionFunctionContext = { history: [], tokens: [] };

describe('lexEvent', () => {
  it('reads the event name and transitions to EVENT_HANDLER', () => {
    const cursor = new LexerCursor('(click)="onClick"');
    expect(lexEvent(cursor, context)).toEqual({
      state: LexerState.EVENT_HANDLER,
      tokens: [{ type: TokenType.EVENT, parts: ['click'] }]
    });
    // The opening quote of the handler is consumed
    expect(cursor.peek()).toBe('o'.charCodeAt(0));
  });

  it('reads an event name containing dashes, colons and dots', () => {
    const cursor = new LexerCursor('(my-event:done.x)="onDone"');
    expect(lexEvent(cursor, context).tokens).toEqual([{ type: TokenType.EVENT, parts: ['my-event:done.x'] }]);
  });

  it('reads an event sharing its name with a flow-control keyword', () => {
    const cursor = new LexerCursor('(switch)="onSwitch"');
    expect(lexEvent(cursor, context).tokens).toEqual([{ type: TokenType.EVENT, parts: ['switch'] }]);
  });

  it('throws on a space inside the event name', () => {
    const cursor = new LexerCursor('(cli ck)="onClick"');
    expect(() => lexEvent(cursor, context)).toThrow('No spaces are allowed in event name');
  });

  it.each([
    ['a tab', '\t'],
    ['a line feed', '\n'],
    ['a carriage return', '\r']
  ])('throws on %s following the event name, rather than reading it as part of the name', (_description, whitespace) => {
    const cursor = new LexerCursor(`(click${whitespace})="onClick"`);
    expect(() => lexEvent(cursor, context)).toThrow('No spaces are allowed in event name');
  });

  it('throws when the event name is empty', () => {
    const cursor = new LexerCursor('()="onClick"');
    expect(() => lexEvent(cursor, context)).toThrow('Event name cannot be empty');
  });

  it.each([
    ['=', '(click="onClick"'],
    ['a double quote', '(click"onClick"'],
    ['a single quote', '(click\'onClick\''],
    ['>', '(click>'],
    ['/', '(click/>'],
    ['another (', '((click))="onClick"'],
    ['a ( inside the name', '(cli(ck)="onClick"']
  ])('throws when the event name is not closed by ) before %s', (_description, input) => {
    expect(() => lexEvent(new LexerCursor(input), context)).toThrow('Event name must be closed by \')\'');
  });

  it('hints at the space between the selector and the bindings of a directive when the event name is not closed right after it', () => {
    const tokens = [
      { type: TokenType.DIRECTIVE, parts: ['myDirective'], span: { start: 0, end: 13 } },
      { type: TokenType.DIRECTIVE_CLOSE, span: { start: 0, end: 13 } }
    ] as Token[];

    expect(() => lexEvent(new LexerCursor('(display="block")'), { history: [], tokens })).toThrow('directive bindings must immediately follow the selector, without spaces');
  });

  it('does not hint at a directive when the unclosed event name follows a directive with bindings', () => {
    const tokens = [
      { type: TokenType.DIRECTIVE, parts: ['myDirective'], span: { start: 0, end: 13 } },
      { type: TokenType.ATTRIBUTE, parts: ['disabled'], span: { start: 14, end: 22 } },
      { type: TokenType.DIRECTIVE_CLOSE, span: { start: 22, end: 23 } }
    ] as Token[];

    expect(() => lexEvent(new LexerCursor('(click="f()"'), { history: [], tokens })).toThrow(/^Event name must be closed by '\)'$/);
  });

  it('throws when the event name is not followed by =', () => {
    expect(() => lexEvent(new LexerCursor('(click) ="onClick"'), context)).toThrow('Event name must be followed by \'=\'');
    expect(() => lexEvent(new LexerCursor('(click)>'), context)).toThrow('Event name must be followed by \'=\'');
  });

  it('throws when the handler is not wrapped in double quotes', () => {
    const cursor = new LexerCursor('(click)=onClick');
    expect(() => lexEvent(cursor, context)).toThrow('Event handler must be included in Double Quotes');
  });
});
