import { AT_SIGN, SPACE, GREATER_THEN, SLASH } from "../../costants/chars.constants";
import { Cursor } from "../models/cursor.model";
import { LexerState } from "../models/lexer-state.enum";
import { TokenType } from "../models/token-type.enum";
import { Token } from "../models/token.type";
import { LexerTransitionFunctionReturnType } from "../models/transition-function-return-type.type";

  export function consumeTagOpenBody(cursor: Cursor): LexerTransitionFunctionReturnType {
    let read = true;
    let nextState!: LexerState
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
          nextState = LexerState.TEXT
          read = false;
          break;

        default:
          tokens.push(...consumeAttribute(cursor));
      }
    }

    return {
      state: nextState,
      tokens
    }
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