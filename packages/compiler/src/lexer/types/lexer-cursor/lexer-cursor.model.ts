import { PositiveInteger, TupleOfLength } from '@xaendar/types';
import { EOF } from '../../../costants/chars.constant';
import { COMMENT_END, COMMENT_START } from '../../../costants/comment.costant';
import { Cursor } from '../../../models/cursor/cursor';
import { isWhitespace } from '../../utils/chars/chars.utils';
import { CurrentChar } from '../current-char.type';

/**
 * Unique identifier to be thrown in the cause field
 * of an error when the template has reached its end.
 */
export const endOfFile = Symbol('endOfFile');

/**
 * The error thrown when the cursor reaches the end of the template, its cause being {@link endOfFile}.
 *
 * N.B. Deliberate, for speed: one error for every cursor, created once, since its stack trace is never read. Creating
 * one per end of the input captured a stack trace each time. Do not create it where it is thrown.
 */
const END_OF_FILE_ERROR = new Error('', { cause: endOfFile });

/**
 * Cursor abstraction used by the Lexer to navigate the input source.
 *
 * The LexerCursor is responsible for:
 * - Sequential character consumption
 * - Lookahead (peek) operations without state mutation
 * - Tracking logical position (row, column)
 * - Handling end-of-file conditions
 *
 * This class deliberately contains **no lexer logic**:
 * it does not know about tokens, states, or grammar rules.
 * Its sole responsibility is controlled navigation of the input stream.
 */
export class LexerCursor extends Cursor {
  /**
   * Representation of the current character.
   *
   * - `index`: absolute index within the input string
   * - `code`: Unicode code point of the character
   * - `value`: actual character value
   *
   * An index of `-1` indicates that the cursor has not yet consumed
   * any character or has reached EOF.
   */
  private readonly _currentChar: CurrentChar = {
    code: 0,
    index: -1,
    value: ''
  };

  /**
   * Returns a read-only snapshot of the current character.
   */
  public get currentChar(): Readonly<CurrentChar> {
    return this._currentChar;
  }

  /**
   * Creates a new cursor for the given input source.
   *
   * @param input - Full source string to be tokenised.
   */
  constructor(input: string) {
    super(input);
  }

  /**
   * Advances the cursor by the specified number of characters.
   *
   * This method:
   * - Updates the current character
   * - Updates row/column position
   * - Detects line breaks (LF / CR)
   * - Throws an EOF error when the end of the input is reached
   *
   * @param chars - Number of characters to consume. Must be >= 1.
   * @throws When `chars` is less than 1 or when advancing past the end of the input.
   */
  public advance(chars = 1): void {
    if (chars < 1) {
      throw `${chars} is not a valid value. Please enter a number equal or greater than 1`;
    }

    const newIndex = this._currentChar.index + chars;

    if (newIndex >= this.input.length) {
      this._currentChar.code = EOF;
      this._currentChar.index = -1;
      this._currentChar.value = '';
      this._throwEOFError();
    } else {
      this._currentChar.index = newIndex;
      this._currentChar.value = this.input[newIndex];
      this._currentChar.code = this.input.charCodeAt(newIndex);
    }
  }

  /**
   * Checks whether the upcoming characters in the input match the given pattern,
   * without advancing the cursor.
   *
   * - `string`: compares the input from the next character, a pattern longer than what is left does not match
   * - `RegExp`: a sticky pattern (`y` flag, no `^`), matched against the input from the next character: its lookaheads
   *   read the input that follows, up to its end.
   *
   * N.B. Deliberate, for speed: a sticky pattern is matched in the input itself. Matching a slice of it copied the rest
   * of the template for a lookahead of unknown length (the `;` after an `@import`). Do not slice the input.
   *
   * @param pattern - String or sticky RegExp to match against.
   * @returns `true` if the upcoming characters match, `false` otherwise.
   * @throws When the RegExp is not sticky, which would match anywhere after the cursor.
   */
  public peekMatch(pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
      this._consumeComment();
      return this.input.startsWith(pattern, this._currentChar.index + 1);
    }

    if (!pattern.sticky) {
      throw new Error(`${pattern} must be sticky (y flag) to match from the cursor`);
    }

    pattern.lastIndex = this._currentChar.index + 1;
    return pattern.test(this.input);
  }

  /**
   * Peeks ahead in the input stream without advancing the cursor.
   *
   * This method supports:
   * - Single-character lookahead
   * - Multi-character lookahead
   * - Optional offset from the current position
   *
   * Peek operations do not modify the cursor state.
   *
   * @returns
   * - A single Unicode code point when peeking one character
   * - An array of Unicode code points when peeking multiple characters
   *
   * @throws Error with cause `EOF` if the peek exceeds input length
   */
  public peek(): number;
  public peek<OffSet extends number>(options?: { offset?: PositiveInteger<OffSet> }): number;
  public peek(chars: 1): number;
  public peek<OffSet extends number>(chars: 1, options?: { offset?: PositiveInteger<OffSet> }): number;
  public peek<ReadChars extends number>(chars: PositiveInteger<ReadChars>): TupleOfLength<ReadChars>;
  public peek<ReadChars extends number, OffSet extends number>(chars: PositiveInteger<ReadChars>, options?: { offset?: PositiveInteger<OffSet> }): TupleOfLength<ReadChars>;
  public peek(charsOrOptions?: number | { offset?: number }, options?: { offset?: number }): number | number[] {
    this._consumeComment();
    const chars = typeof charsOrOptions === 'number' ? charsOrOptions : 1;
    const offset = (typeof charsOrOptions === 'object' ? charsOrOptions : options)?.offset ?? 0;
    return chars === 1 ? this._peekOneChar(this._currentChar.index + offset + 1) : this._peekMany(chars, offset);
  }

  /**
   * Peeks the next character as it is written, without skipping the HTML comments as {@link peek} does: for the content
   * read verbatim, where `<!--` is text (a static attribute value, an expression and its strings, an import path).
   *
   * @returns The code of the next character.
   * @throws Error with cause `EOF` if the input is over.
   */
  public peekVerbatim(): number {
    return this._peekOneChar(this._currentChar.index + 1);
  }

  /**
   * Checks whether the characters following the whitespace (spaces, tabs and line breaks) after the current position
   * start with a text, without advancing the cursor: e.g. the parentheses following a keyword on another line. Reaching
   * the end of the input does not throw.
   *
   * @param pattern - The text.
   * @returns `true` if the characters after the whitespace start with the text, `false` otherwise.
   */
  public peekMatchAfterSpaces(pattern: string): boolean {
    return this.input.startsWith(pattern, this._skipWhitespace(this._currentChar.index + 1));
  }

  /**
   * Checks whether whitespace (spaces, tabs and line breaks) follows the current position, then a keyword, then
   * whitespace again, without advancing the cursor: e.g. the `as` of a cast in `value() as string`. Reaching the end of
   * the input does not throw.
   *
   * @param keyword - The keyword.
   * @returns `true` if the keyword is written between whitespace right after the current position, `false` otherwise.
   */
  public peekKeywordAfterSpaces(keyword: string): boolean {
    const start = this._currentChar.index + 1;
    const index = this._skipWhitespace(start);
    const end = index + keyword.length;
    return index > start && this.input.startsWith(keyword, index) && this._skipWhitespace(end) > end;
  }

  /**
   * Skips all consecutive whitespace characters (spaces, tabs and line breaks) from the current position.
   */
  public skipSpaces(): void {
    while (isWhitespace(this.peek())) {
      this.advance();
    }
  }

  /**
   * Finds the end of the whitespace (spaces, tabs and line breaks) starting at an index of the input.
   *
   * @param index - The index the whitespace starts at.
   * @returns The index of the first character after the whitespace: `index` itself when no whitespace is there, the
   *   length of the input when the whitespace reaches its end.
   */
  private _skipWhitespace(index: number): number {
    while (isWhitespace(this.input.charCodeAt(index))) {
      index++;
    }

    return index;
  }

  /**
   * Peeks multiple characters ahead.
   *
   * @param chars - The number of characters to peek.
   * @param offset - The number of characters to skip after the current one before the first one peeked.
   * @returns The codes of the characters.
   * @throws Error with cause `EOF` if the peek exceeds input length.
   */
  private _peekMany(chars: number, offset: number): number[] {
    const peekedChars = new Array<number>;
    const nextCharIndex = this._currentChar.index + offset + 1;

    for (let i = nextCharIndex; i < nextCharIndex + chars; i++) {
      peekedChars.push(this._peekOneChar(i));
    }

    return peekedChars;
  }

  /**
   * Peeks a single character at the given absolute index.
   *
   * N.B. Deliberate, for speed: the code is read from the input each time. A cache of the codes peeked, a `Map` written
   * on every peek and cleared on every advance, cost far more than `charCodeAt`. Do not cache them.
   *
   * @param index - The index of the character.
   * @returns The code of the character.
   * @throws Error with cause `EOF` if the index exceeds input length.
   */
  private _peekOneChar(index: number): number {
    if (index >= this.input.length) {
      this._throwEOFError();
    }

    return this.input.charCodeAt(index);
  }

  /**
   * Consumes the HTML comments starting right after the current character, up to their closing `-->`,
   * so that peeking never sees them.
   *
   * @throws When a comment is never closed.
   */
  private _consumeComment(): void {
    let start = this._currentChar.index + 1;

    while (this.input.startsWith(COMMENT_START, start)) {
      const end = this.input.indexOf(COMMENT_END, start + COMMENT_START.length);
      if (end === -1) {
        throw `Comment never closed: '${COMMENT_START}' without '${COMMENT_END}'`;
      }

      // Lands on the last character of the closing '-->'
      this.advance(end + COMMENT_END.length - start);
      start = this._currentChar.index + 1;
    }
  }

  /**
   * Throws a standardized EOF error used by the lexer engine
   * to terminate tokenization.
   *
   * @throws Always, an error with cause `EOF`.
   */
  private _throwEOFError(): never {
    throw END_OF_FILE_ERROR;
  }
}
