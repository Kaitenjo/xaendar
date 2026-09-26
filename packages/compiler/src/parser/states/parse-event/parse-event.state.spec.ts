import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { TokenType } from '../../../lexer/types/token-type.enum';
import { Token } from '../../../lexer/types/token.type';
import { EventToken } from '../../../lexer/types/tokens/event-token.type';
import { ParserCursor } from '../../models/parser-cursor/parser-cursor.model';
import { ASTNodeType } from '../../types/node.enum';
import { parseEvent } from './parse-event.state';

const runTokens = (tokens: Token[]) => {
  const cursor = new ParserCursor('', tokens);
  return parseEvent(cursor, () => undefined, cursor.peek() as EventToken);
};

// Skips the TAG_OPEN_NAME token so the cursor starts on the EVENT token
const run = (template: string) => runTokens(new Lexer(template).tokenize().slice(1));

describe('parseEvent', () => {
  it('parses an event without parameters', () => {
    const node = run('<div @click="onClick()"></div>');
    expect(node).toMatchObject({ type: ASTNodeType.Event, name: 'click', handler: 'onClick', parameters: [] });
  });

  it('parses an event with parameters', () => {
    const node = run('<div @click="onClick(a, b + 1)"></div>');
    expect(node.parameters.map(p => p.getText())).toEqual(['a', 'b + 1']);
  });

  it('throws when the event is not followed by a handler', () => {
    expect(() => runTokens([{ type: TokenType.EVENT, parts: ['click'], span: { start: 0, end: 5 } }])).toThrow('Invalid event format for click');
  });
});
