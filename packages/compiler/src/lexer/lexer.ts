import { Dictionary } from '@xendar/common';
import { AT_SIGN, EOF, GREATER_THEN, LEFT_BRACE, LESS_THAN, LF, SLASH, SPACE } from './costants/chars.constants';
import { Cursor } from './models/cursor.model';
import { LexerState } from './models/lexer-state.enum';
import { TokenType } from './models/token-type.enum';
import { Token } from './models/token.type';
import { LexerTransitionFunctionReturnType } from './models/transition-function-return-type.type';
import { LexerTransitionFunction } from './models/transition-function.type';
import { isNotBlank } from './utils/chars.utils';

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

  private readonly _states: Dictionary<LexerState, LexerTransitionFunction> = {
    [LexerState.START]: this.consumeText.bind(this),
    [LexerState.TAG_OPEN_NAME]: this.consumeTagOpenName.bind(this),
    [LexerState.TAG_OPEN_BODY]: this.consumeTagOpenBody.bind(this),
    [LexerState.TEXT]: this.consumeText.bind(this),
    [LexerState.TAG_CLOSE_NAME]: this.consumeTagCloseName.bind(this)
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
        } else {
          throw err;
        }
      }
    }

    return this._tokens;
  }

  private consumeTagOpenName(): LexerTransitionFunctionReturnType {
    let read = true;
    let tagName = '';

    // Consume '<' character
    this._cursor.advance();

    /*
      Skip all the spaces between '<' and the actual tag name
      Ex: '<         div>
    */
    while (this._cursor.peek() === SPACE) {
      this._cursor.advance();
    }

    /*
      Keep read input until:
      - Space: <span 
      - GT: <span>
      - Slash (Self Closing tag) <span / or <span/
    */
    while (read) {
      switch (this._cursor.peek()) {
        case SPACE:
        case SLASH:
        case GREATER_THEN:
          read = false;
          break;
        default:
          this._cursor.advance();
          tagName = `${tagName}${this._cursor.currentChar.value}`
      }
    }

    return {
      state: LexerState.TAG_OPEN_BODY,
      tokens: [{
        type: TokenType.TAG_OPEN_NAME,
        parts: [tagName]
      }]
    }
  }

  private consumeTagOpenBody(): LexerTransitionFunctionReturnType {
    let read = true;
    let nextState!: LexerState
    const tokens = new Array<Token>;

    while (read) {
      const nextChar = this._cursor.peek();

      switch (nextChar) {
        case AT_SIGN:
          tokens.push(...this.consumeEvent());
          break;

        case SPACE:
          this._cursor.advance();
          break;

        case GREATER_THEN:
        case SLASH:
          tokens.push(...this.consumeTagOpenEnd());
          nextState = LexerState.TEXT
          read = false;
          break;

        default:
          tokens.push(...this.consumeAttribute());
      }
    }

    return {
      state: nextState,
      tokens
    }
  }

  private consumeAttribute(): Token[] {
    let read = true;
    let attribute = '';

    while (read) {
      switch (this._cursor.peek()) {
        case SPACE:
        case SLASH:
        case GREATER_THEN:
          read = false;
          break;
        default:
          this._cursor.advance();
          attribute = `${attribute}${this._cursor.currentChar.value}`
      }
    }

    return [{
      type: TokenType.ATTRIBUTE,
      parts: [attribute]
    }];
  }

  private consumeEvent(): Token[] {
    let read = true;
    let event = '';

    while (read) {
      switch (this._cursor.peek()) {
        case SPACE:
        case SLASH:
        case GREATER_THEN:
          read = false;
          break;
        default:
          this._cursor.advance();
          event = `${event}${this._cursor.currentChar.value}`
      }
    }

    return [{
      type: TokenType.EVENT,
      parts: [event]
    }];
  }

  private consumeTagOpenEnd(): Token[] {
    const tokens = new Array<Token>;

    // We arrive in this point by reading '>' or '/' at the end of a Open Tag 
    if (this._cursor.peek() === GREATER_THEN) {
      this._cursor.advance();
    } else {
      this._cursor.advance();
      const nextChar = this._cursor.peek();

      if (nextChar === GREATER_THEN) {
        this._cursor.advance();
        tokens.push({ type: TokenType.TAG_SELF_CLOSE, parts: [] });
      } else {
        throw new Error(`Unexpected character ${nextChar} for closing tag.\nExpected />\nRead of /${String.fromCharCode(nextChar)}\nAt line ${this._cursor.position.row + 1} col ${this._cursor.position.column + 1}`)
      }
    }

    return tokens;
  }

  private consumeTagCloseName(): LexerTransitionFunctionReturnType {
    let read = true;
    let nextState!: LexerState;
    let tagName = '';
    const tokens = new Array<Token>;

    // Skip '</'
    this._cursor.advance(2);

    /*
      Skip all the spaces between '</' and the actual tag name
      Ex: '</         div>
    */
    while (this._cursor.peek() === SPACE) {
      this._cursor.advance();
    }

    while (read) {
      switch (this._cursor.peek()) {
        case GREATER_THEN:
          tokens.push(
            { type: TokenType.TAG_CLOSE_NAME, parts: [tagName] },
          );
          this._cursor.advance();
          nextState = LexerState.TEXT;
          read = false;
          break;

        case SPACE:
          throw new Error('Tag Close Name cannot contains spaces');

        default:
          this._cursor.advance();
          tagName = `${tagName}${this._cursor.currentChar.value}`;
      }
    }

    return {
      state: nextState,
      tokens
    }
  }

  private consumeText(): LexerTransitionFunctionReturnType {
    let read = true;
    let nextState!: LexerState;
    let text = '';

    while (read) {
      switch (this._cursor.peek()) {
        case LESS_THAN:
          // If after '<' we read a '/', we suppose we're approaching a ClosureTag, otherwise an OpenTag
          nextState = this._cursor.peek(1, { offset: 1 }) === SLASH ? LexerState.TAG_CLOSE_NAME : LexerState.TAG_OPEN_NAME;
          read = false;
          break;

        case LEFT_BRACE:
          nextState = LexerState.INTERPOLATION_START;
          read = false;
          break;

        case SPACE:
        case LF:
          this._cursor.advance();
          break;

        default:
          this._cursor.advance();
          text = `${text}${this._cursor.currentChar.value}`;
      }
    }


    /*
      If the first read character trigger a StateChange
      The cumulative `text` variable will be empty

      In this case we must NOT add any token

      Ex:
      Template starts with a tag:
        `<div ...`
      Or an interpolation:
        `{ myVariable }`
    */
    const tokens: Token[] | undefined = isNotBlank(text)
      ? [{ type: TokenType.TEXT, parts: [text] }]
      : undefined;

    return {
      state: nextState,
      tokens
    }
  }
}


console.log(new Lexer(`
<sp$a£n@ asd@ciao test="ciao" @click="onClick()" @suck="myDick()" />
<div dick>
  Text
</ div>
`).tokenize().map(e => {
  switch (e.type) {
    case TokenType.TEXT:
      e.type = 'text' as any
      break;
    case TokenType.ATTRIBUTE:
      e.type = 'attribute' as any
      break;
    case TokenType.EVENT:
      e.type = 'event' as any;
      break;
    case TokenType.TAG_SELF_CLOSE:
      e.type = 'self-close' as any;
      break;
    case TokenType.TAG_OPEN_NAME:
      e.type = 'open-name' as any;
      break;
    case TokenType.TAG_CLOSE_NAME:
      e.type = 'close-name' as any
      break;
  }
  return e;
}));