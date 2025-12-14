import { Dictionary } from '@xendar/common';
import { AT_SIGN, EOF, GREATER_THEN, LEFT_BRACE, SLASH, SPACE } from './costants/chars.constants';
import { Cursor } from './models/cursor.model';
import { LexerState } from './models/lexer-state.enum';
import { TokenType } from './models/token-type.enum';
import { Token } from './models/token.type';
import { LexerTransitionFunctionReturnType } from './models/transition-function-return-type.type';
import { LexerTransitionFunction } from './models/transition-function.type';


/**
 * Utility class that emulates a cursor navigating through a template string.
 *
 * The cursor keeps track of the current character, its absolute position
 * within the text, and its logical position expressed as row and column.
 * This is useful when parsing or analyzing template content character by character.
 */
export class Lexer {

  private readonly _cursor;

  private readonly _tokens = new Array<Token>;

  private _state = LexerState.NONE;

  private _states: Dictionary<LexerState, LexerTransitionFunction> = {
    [LexerState.NONE]: start,
    [LexerState.TAG_NAME]: consumeElementName,
    [LexerState.TAG_BODY]: consumeElementBody
  }

  /**
   * Creates a new Cursor instance for the given template content.
   *
   * @param input The full template text that the cursor will navigate.
   */
  constructor(public input: string) {
    this._cursor = new Cursor(this.input);
  }

  public tokenize(): void {
    const cursor = this._cursor;

    while (cursor.peek() !== EOF) {
      const transitionFunction = this._states[this._state];
      const { state, tokens } = transitionFunction!(cursor);

      if (tokens?.length) {
        this._tokens.push(...tokens);
      }

      this._state = state;
    }
  }
}

function start(_cursor: Cursor): LexerTransitionFunctionReturnType {
  return { state: LexerState.TAG_NAME };
}

function consumeElementName(cursor: Cursor): LexerTransitionFunctionReturnType {
  cursor.advance();

  let tagName = '';
  /*
    Keep read input until:
    - Space: <span 
    - GT: <span>
    - Slash (Self Closing tag) <span /
    - EOF 
  */
  while (![SPACE, SLASH, GREATER_THEN, EOF].includes(cursor.peek())) {
    cursor.advance();
    tagName = `${tagName}${cursor.currentChar.value}`
  }

  return {
    state: LexerState.TAG_BODY,
    tokens: [
      {
        type: TokenType.TAG_OPEN_START,
        parts: [tagName]
      }
    ]
  }
}

function consumeElementBody(cursor: Cursor): LexerTransitionFunctionReturnType {
  const tokens = new Array<Token>;

  while (![GREATER_THEN, SLASH, EOF].includes(cursor.peek())) {
    const nextChar = cursor.peek();
    if (nextChar === AT_SIGN) {
      tokens.push(consumeEvent(cursor));
    } else {
      tokens.push(consumeAttribute(cursor));
    }
  }

  return {
    state: LexerState.TAG_CLOSE,
    tokens
  }
}

function consumeEvent(cursor: Cursor): Token[] {
  
  return []
}

console.log(new Lexer('<span').tokenize());