import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { EventToken } from '../../../lexer/types/tokens/event-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNodeType } from '../../types/node.enum';
import { parseEvent } from './parse-event.state';
import type { Span } from '../../../types/span.type';
import { getTemplateSpan } from '../../utils/expression-validator/expression-validator';

const runTokens = (tokens: Token[], template = '') => {
  const cursor = new ParserCursor(template, tokens);
  return parseEvent(cursor, () => undefined, cursor.peek() as EventToken);
};

// Skips the TAG_OPEN_NAME token so the cursor starts on the EVENT token
const run = (template: string) => runTokens(new Lexer(template).tokenize().slice(1), template);

describe('parseEvent', () => {
  it('parses an event without parameters', () => {
    const node = run('<div (click)="onClick()"></div>');
    expect(node).toMatchObject({ type: ASTNodeType.Event, name: 'click', handler: 'onClick', parameters: [] });
  });

  it('parses an event with parameters', () => {
    const node = run('<div (click)="onClick(a, b + 1)"></div>');
    expect(node.parameters.map(p => p.getText())).toEqual(['a', 'b + 1']);
  });

  it('parses the casts of the parameters, by the index of the parameter', () => {
    const template = '<div (click)="onClick($event as MouseEvent, a, b + 1 as number)"></div>';
    const node = run(template);

    expect(node.parameters.map(p => p.getText())).toEqual(['$event', 'a', 'b + 1']);
    expect(node.casts).toEqual(new Map([
      [0, { text: 'MouseEvent', span: { start: template.indexOf('MouseEvent'), end: template.indexOf(', a') } }],
      [2, { text: 'number', span: { start: template.indexOf('number'), end: template.indexOf(')"') } }]
    ]));
    expect(node.span.end).toBe(template.indexOf('></div>'));
  });

  it('parses an event without casts', () => {
    expect(run('<div (click)="onClick(a)"></div>')).not.toHaveProperty('casts');
  });

  it('reads the key of a key event, keeping the name as written', () => {
    expect(run('<input (keydown.Enter)="save()" />')).toMatchObject({ name: 'keydown.Enter', key: { event: 'keydown', key: 'enter', modifiers: 0 } });
    expect(run('<input (keyup.control.shift.z)="redo()" />')).toMatchObject({ key: { event: 'keyup', key: 'z', modifiers: 10 } });
    expect(run('<input (keydown.code.keyA)="select()" />').key).toEqual({ event: 'keydown', key: 'keya', modifiers: 0, code: true });
  });

  it('reads no key for any other event', () => {
    expect(run('<input (keydown)="press()" />')).not.toHaveProperty('key');
    expect(run('<x-a (done.x)="press()" />')).not.toHaveProperty('key');
  });

  it('throws for a key event naming no key or a modifier that does not exist, on the name', () => {
    const template = '<input (keydown.ctrl.s)="save()" />';
    let error: Error | undefined;
    try {
      run(template);
    } catch (thrown) {
      error = thrown as Error;
    }

    expect(error?.message).toBe('"ctrl" is not a modifier of the key event "keydown.ctrl.s": alt, control, meta, shift or code');
    expect(error?.cause).toEqual({ start: template.indexOf('keydown'), end: template.indexOf(')=') });
    expect(() => run('<input (keydown.)="save()" />')).toThrow('The key event "keydown." names no key: write it after the last dot, e.g. keydown.enter');
  });

  it('throws when the event is not followed by a handler', () => {
    expect(() => runTokens([{ type: TokenType.EVENT, parts: ['click'], span: { start: 0, end: 5 } }])).toThrow('Invalid event format for click');
  });

  it('locates the event name, the handler and the parameters in the template', () => {
    const template = '<a (click)="cart.save(item, $event)">';
    const node = run(template);
    const textOf = (template: string, span: Span | undefined) => span && template.slice(span.start, span.end);

    expect(textOf(template, node.nameSpan)).toBe('click');
    expect(textOf(template, node.handlerSpan)).toBe('cart.save');
    expect(node.parameters.map(parameter => textOf(template, getTemplateSpan(parameter)))).toEqual(['item', '$event']);
  });
});
