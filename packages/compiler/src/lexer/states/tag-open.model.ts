import { AT_SIGN, GREATER_THEN, SLASH, SPACE } from "../../costants/chars.constants";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { Token } from "../models/token.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function-return-type.type";

export function consumeTagOpen(cursor: Cursor): LexerTransitionFunctionReturnType {
  const tokens = new Array<Token>;

  // Consume '<' character
  cursor.advance();

  /*
    Skip all the spaces between '<' and the actual tag name
    Ex: '<         div>
  */
  while (cursor.peek() === SPACE) {
    cursor.advance();
  }

  tokens.push(
    ...consumeTagName(cursor),
    ...consumeTagBody(cursor)
  );

  return {
    state: LexerState.TEXT,
    tokens
  }
}

function consumeTagName(cursor: Cursor): Token[] {
  let read = true;
  let tagName = '';
  const tokens = new Array<Token>;

  /*
    Keep read input until:
    - Space: <span 
    - GT: <span>
    - Slash (Self Closing tag) <span / or <span/
  */
  while (read) {
    switch (cursor.peek()) {
      case SPACE:
      case SLASH:
      case GREATER_THEN:
        tokens.push({ type: TokenType.TAG_OPEN_NAME, parts: [tagName] });
        read = false;
        break;

      default:
        cursor.advance();
        tagName = `${tagName}${cursor.currentChar.value}`
    }
  }

  return tokens;
}

function consumeTagBody(cursor: Cursor): Token[] {
  let read = true;
  const tokens = new Array<Token>;

  while (read) {
    const nextChar = cursor.peek();

    switch (nextChar) {
      case AT_SIGN:
        tokens.push(...consumeEvent(cursor));
        break;

      case SPACE:
        cursor.advance();
        break;

      case GREATER_THEN:
      case SLASH:
        tokens.push(...consumeTagOpenEnd(cursor));
        read = false;
        break;

      default:
        tokens.push(...consumeAttribute(cursor));
    }
  }

  return tokens;
}

function consumeAttribute(cursor: Cursor): Token[] {
  let read = true;
  let attribute = '';

  while (read) {
    switch (cursor.peek()) {
      case SPACE:
      case SLASH:
      case GREATER_THEN:
        read = false;
        break;

      default:
        cursor.advance();
        attribute = `${attribute}${cursor.currentChar.value}`
    }
  }

  return [{
    type: TokenType.ATTRIBUTE,
    parts: [attribute]
  }];
}

function consumeEvent(cursor: Cursor): Token[] {
  let read = true;
  let event = '';

  while (read) {
    switch (cursor.peek()) {
      case SPACE:
      case SLASH:
      case GREATER_THEN:
        read = false;
        break;
      default:
        cursor.advance();
        event = `${event}${cursor.currentChar.value}`
    }
  }

  return [{
    type: TokenType.EVENT,
    parts: [event]
  }];
}

function consumeTagOpenEnd(cursor: Cursor): Token[] {
  const tokens = new Array<Token>;

  // We arrive in this point by reading '>' or '/' at the end of a Open Tag 
  if (cursor.peek() === GREATER_THEN) {
    cursor.advance();
  } else {
    cursor.advance();
    const nextChar = cursor.peek();

    if (nextChar === GREATER_THEN) {
      cursor.advance();
      tokens.push({ type: TokenType.TAG_SELF_CLOSE, parts: [] });
    } else {
      throw new Error(`Unexpected character ${nextChar} for closing tag.\nExpected />\nRead of /${String.fromCharCode(nextChar)}\nAt line ${cursor.position.row + 1} col ${cursor.position.column + 1}`)
    }
  }

  return tokens;
}