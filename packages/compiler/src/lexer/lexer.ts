import { Dictionary } from '@xendar/common';
import { AT_SIGN, EOF, GREATER_THEN, LESS_THAN, SLASH, SPACE } from './costants/chars.constants';
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

  private eof = false;

  private readonly _tokens = new Array<Token>;

  private _state = LexerState.START;

  private _states: Dictionary<LexerState, LexerTransitionFunction> = {
    [LexerState.START]: this.consumeText.bind(this),
    [LexerState.TAG_OPEN]: this.consumeElementName.bind(this),
    [LexerState.TAG_BODY]: this.consumeElementBody.bind(this),
    [LexerState.TAG_CLOSE]: this.consumeElementClosure.bind(this),
    [LexerState.TEXT]: this.consumeText.bind(this)
  }

  /**
   * Creates a new Cursor instance for the given template content.
   *
   * @param input The full template text that the cursor will navigate.
   */
  constructor(public input: string) {
    this._cursor = new Cursor(this.input);
  }

  public tokenize(): Token[] {
    while (!this.eof) {
      try {
        const transitionFunction = this._states[this._state];
        const { state, tokens } = transitionFunction!();

        if (tokens?.length) {
          this._tokens.push(...tokens);
        }

        this._state = state;
      } catch (err) {
        const error = err as Error;
        if (error.cause === EOF) {
          this.eof = true;
        } else{
          throw err;
        }
      }
    }

    return this._tokens;
  }

  private consumeElementName(): LexerTransitionFunctionReturnType {
    // Consume '<' character
    this._cursor.advance();

    let tagName = '';

    /*
      Keep read input until:
      - Space: <span 
      - GT: <span>
      - Slash (Self Closing tag) <span /
    */
    while (![SPACE, SLASH, GREATER_THEN].includes(this._cursor.peek())) {
      this._cursor.advance();
      tagName = `${tagName}${this._cursor.currentChar.value}`
    }

    return {
      state: LexerState.TAG_BODY,
      tokens: [{
        type: TokenType.TAG_OPEN_START,
        parts: [tagName]
      }]
    }
  }

  private consumeElementBody(): LexerTransitionFunctionReturnType {
    const tokens = new Array<Token>;

    while (![GREATER_THEN, SLASH].includes(this._cursor.peek())) {
      const nextChar = this._cursor.peek();
      switch (nextChar) {
        case AT_SIGN:
          tokens.push(...this.consumeEvent());
          break;
        case SPACE:
          this._cursor.advance();
          break;
        default:
          tokens.push(...this.consumeAttribute());
      }
    }

    return {
      state: LexerState.TAG_CLOSE,
      tokens
    }
  }

  private consumeElementClosure(): LexerTransitionFunctionReturnType {
    while (true) {
      let nextChar = this._cursor.peek();
      switch (nextChar) {
        case GREATER_THEN:
          this._cursor.advance()
          return {
            state: LexerState.START,
            tokens: [{
              type: TokenType.TAG_OPEN_END,
              parts: []
            }]
          }
        case SLASH: {
          this._cursor.advance();
          nextChar = this._cursor.peek();
          if (nextChar === GREATER_THEN) {
            this._cursor.advance();
            return {
              state: LexerState.START,
              tokens: [{
                type: TokenType.TAG_SELF_CLOSE,
                parts: []
              }]
            }
          } else {
            return { state: LexerState.TAG_BODY }
          }
        }
        default:
          return {
            state: LexerState.START,
          }
      }
    }
  }

  private consumeAttribute(): Token[] {
    let attribute = '';

    while (![SPACE, SLASH, GREATER_THEN].includes(this._cursor.peek())) {
      this._cursor.advance();
      attribute = `${attribute}${this._cursor.currentChar.value}`
    }

    return [{
      type: TokenType.ATTRIBUTE,
      parts: [attribute]
    }]
  }

  private consumeEvent(): Token[] {
    let event = '';

    while (![SPACE, SLASH, GREATER_THEN].includes(this._cursor.peek())) {
      this._cursor.advance();
      event = `${event}${this._cursor.currentChar.value}`
    }

    return [{
      type: TokenType.EVENT,
      parts: [event]
    }]
  }

  private consumeText(): LexerTransitionFunctionReturnType {
    let text = '';

    while (![LESS_THAN].includes(this._cursor.peek())) {
      this._cursor.advance();
      text = `${text}${this._cursor.currentChar.value}`;
    }

    return {
      state: LexerState.TAG_OPEN,
      tokens: [{
        type: TokenType.TEXT,
        parts: [text]
      }]
    }
  }
}


console.log(new Lexer(`
  <span asd@ciao test="ciao" @click="onClick()" @suck="myDick()" />
  <div dick>
    Text
  </div>
`).tokenize().map(e => {
  switch (e.type) {
    case TokenType.TEXT:
      e.type = 'text' as any
      break;
    case TokenType.ATTRIBUTE:
      e.type = 'attribute' as any
      break;
    case TokenType.TAG_OPEN_END:
      e.type = 'open end' as any;
      break;
    case TokenType.EVENT:
      e.type = 'event' as any;
      break;
    case TokenType.TAG_SELF_CLOSE:
      e.type = 'self-close' as any;
      break;
    case TokenType.TAG_OPEN_START:
      e.type = 'open-start' as any;
      break;
  }
  return e;
}));