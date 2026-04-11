import { PositiveInteger, TupleOfLength } from '@xendar/common';
import { EOF } from '../../costants/chars.constants';
import { TokenType } from '../../lexer/models/token-type.enum';
import { Token } from '../../lexer/models/token.type';
import { CurrentToken } from './current-token.type';

/**
 * Cursor abstraction used by the Parser to navigate
 * through a sequence of tokens produced by the Lexer.
 *
 * Responsibilities:
 * - Sequential token consumption
 * - Lookahead (peek) operations without mutating state
 * - Handling end-of-file conditions
 *
 * This class does not perform parsing itself: it only
 * manages position and access to the token stream.
 */
export class ParserCursor {

  /**
   * Representation of the current token.
   *
   * - `index`: absolute index within the token array
   * - `value`: current token object (or EOF token)
   *
   * An index of `-1` indicates that the cursor has not
   * yet consumed any token or has reached EOF.
   */
  private readonly _currentToken: CurrentToken = {
    value: { type: TokenType.EOF },
    index: -1
  };

  /**
   * Returns a read-only snapshot of the current token.
   */
  public get currentToken(): Readonly<CurrentToken> {
    return this._currentToken;
  }

  /**
   * Creates a new ParserCursor for the given token array.
   *
   * @param _tokens Array of tokens to navigate.
   */
  constructor(private readonly _tokens: Token[]) { }

  /**
   * Advances the cursor by the specified number of tokens.
   *
   * Updates the current token and index.
   *
   * @param chars Number of tokens to advance (must be >= 1)
   *
   * @throws Error with cause `EOF` when advancing past the end
   */
  public advance(chars = 1): void {
    if (chars < 1) {
      throw new Error(`${chars} is not a valid value. Please enter a number equal or greater than 1`);
    }

    const newIndex = this._currentToken.index + chars;

    if (newIndex >= this._tokens.length) {
      this._currentToken.value = { type: TokenType.EOF };
      this._currentToken.index = -1;
      this.throwEOFError();
    } else {
      this._currentToken.index = newIndex;
      this._currentToken.value = this._tokens[newIndex]!;
    }
  }

  /**
   * Peeks ahead in the token stream without advancing the cursor.
   *
   * Supports:
   * - Single-token lookahead
   * - Multi-token lookahead
   * - Optional offset from the current token
   *
   * @returns
   * - A single Token when peeking one token
   * - An array of Tokens when peeking multiple tokens
   *
   * @throws Error with cause `EOF` if the peek exceeds the token array
   */
  public peek(): Token;
  public peek<OffSet extends number>(options?: { offset?: PositiveInteger<OffSet> }): Token;
  public peek(chars: 1): Token;
  public peek<OffSet extends number>(chars: 1, options?: { offset?: PositiveInteger<OffSet> }): Token; 
  public peek<ReadChars extends number>(chars: PositiveInteger<ReadChars>): TupleOfLength<ReadChars, Token>; 
  public peek<ReadChars extends number, OffSet extends number>(chars: PositiveInteger<ReadChars>, options?: { offset?: PositiveInteger<OffSet> }): TupleOfLength<ReadChars, Token>;
  public peek(charsOrOptions?: number | { offset?: number }, options?: { offset?: number }): Token | Token[] {
    const tokens = typeof charsOrOptions === 'number' ? charsOrOptions : 1;
    const offset = (typeof charsOrOptions === 'object' ? charsOrOptions : options)?.offset ?? 0;
    return tokens === 1 ? this.peekOneToken(this._currentToken.index + offset + 1) : this.peekMany(tokens + offset);
  }

  /**
   * Peeks multiple tokens ahead.
   */
  private peekMany(chars: number): Token[] {
    const peekedTokens: Token[] = [];
    const nextTokenIndex = this._currentToken.index + 1;

    for (let i = nextTokenIndex; i < nextTokenIndex + chars; i++) {
      peekedTokens.push(this.peekOneToken(i));
    }

    return peekedTokens;
  }

  /**
   * Peeks a single token at the given absolute index.
   */
  private peekOneToken(index: number): Token {
    if (index >= this._tokens.length) {
      this.throwEOFError();
    }

    return this._tokens[index]!;
  }

  /**
   * Throws a standardized EOF error used by the parser
   * to terminate token consumption.
   */
  private throwEOFError(): never {
    throw new Error('', { cause: EOF });
  }
}
