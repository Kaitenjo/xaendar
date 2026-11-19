import { BACKSLASH, DOLLAR, DOUBLE_QUOTE, EQUAL_THEN, GRAVE_ACCENT, GREATER_THEN, LEFT_BRACE, LEFT_BRACKET, LESS_THAN, LPAREN, SINGLE_QUOTE } from '../../costants/chars.constant';
import { CLOSERS } from '../../costants/closers.costant';

/**
 * The character opening the group each character closes.
 */
const OPENERS: ReadonlyMap<number, number> = new Map([...CLOSERS].filter(([opener, closer]) => opener !== closer).map(([opener, closer]) => [closer, opener]));

/**
 * Tells whether a character is one of the terminators of a text, without creating a string for it: the scanner asks
 * it for every character.
 *
 * @param char - The code of the character.
 * @param terminators - The characters that can end the text.
 * @returns `true` if the character is a terminator.
 */
function isTerminator(char: number, terminators: string): boolean {
  for (let i = 0; i < terminators.length; i++) {
    if (terminators.charCodeAt(i) === char) {
      return true;
    }
  }

  return false;
}

/**
 * Follows an expression, or a type, of the template character by character, telling where it is: in code or in a
 * literal (a string, the text of a template literal), and in which groups (`(…)`, `[…]`, `{…}`, and `<…>` in a type).
 * It is the only reading of the literals and of the groups of the template: the lexer reads the expressions and the
 * types with it, the parser splits them, the formatter and the editor find where they end.
 *
 * - In a literal an escaped character closes nothing, and a template literal reads its substitutions (`${…}`) as groups.
 * - A closing character closes the innermost group it matches and the ones left open in it, as `)` does in `f([a)`; one
 *   matching no open group closes nothing.
 * - The `>` of an arrow (`() => void`) closes nothing.
 */
export class ExpressionScanner {
  /**
   * The groups and the template literals open, by their opening character, the innermost last.
   */
  private readonly _nesting = new Array<number>();
  /**
   * The quote of the string the scan is in, `null` outside of a string.
   */
  private _quote: number | null = null;
  /**
   * Whether the last character read, in a literal, escapes the next one.
   */
  private _escaped = false;
  /**
   * The last character read, which starts a substitution (`$`) or an arrow (`=`) with the next one: `0` after an
   * escaped character, which starts nothing.
   */
  private _previous = 0;

  /**
   * Whether the scan is in code: outside of the strings and of the text of the template literals.
   *
   * @returns `true` in code.
   */
  public get isCode(): boolean {
    return this._quote === null && this._nesting.at(-1) !== GRAVE_ACCENT;
  }

  /**
   * Whether the scan is in code outside of any group, e.g. where a comma separates two arguments.
   *
   * @returns `true` outside of any literal and group.
   */
  public get isTopLevel(): boolean {
    return this._quote === null && !this._nesting.length;
  }

  /**
   * The characters closing the groups and the template literals open, the innermost first: what closes the text read
   * so far, e.g. `)]` after `f([a`.
   *
   * @returns The closing characters.
   */
  public get closers(): string {
    let closers = '';
    for (let i = this._nesting.length - 1; i >= 0; i--) {
      closers = `${closers}${String.fromCharCode(CLOSERS.get(this._nesting[i])!)}`;
    }

    return closers;
  }

  /**
   * @param _types - Whether the text holds types, whose type arguments (`<…>`) are groups.
   */
  constructor(private readonly _types = false) { }

  /**
   * Tells whether a text ends before a character, one of `terminators`, in code: a separator (`,`, `;`) outside of any
   * group, a closing character closing no open group, as the `}` of `{ format(a }`.
   *
   * @param char - The code of the character.
   * @param terminators - The characters that can end the text.
   * @returns `true` if the text ends before the character.
   */
  public endsAt(char: number, terminators: string): boolean {
    if (!this.isCode || !isTerminator(char, terminators)) {
      return false;
    }

    const opener = OPENERS.get(char);
    return opener === undefined ? !this._nesting.length : this._isClosing(char, this._previous) && !this._nesting.includes(opener);
  }

  /**
   * Reads a character, following the text past it.
   *
   * @param char - The code of the character.
   */
  public read(char: number): void {
    const previous = this._previous;
    this._previous = this._escaped ? 0 : char;

    if (this._escaped) {
      this._escaped = false;
    } else if (this._quote !== null) {
      this._escaped = char === BACKSLASH;
      this._quote = char === this._quote ? null : this._quote;
    } else if (this._nesting.at(-1) === GRAVE_ACCENT) {
      this._readTemplateText(char, previous);
    } else {
      this._readCode(char, previous);
    }
  }

  /**
   * Reads a text, following it past its end.
   *
   * @param text - The text.
   */
  public readText(text: string): void {
    for (let i = 0; i < text.length; i++) {
      this.read(text.charCodeAt(i));
    }
  }

  /**
   * Reads a character of the text of a template literal: an escape, the backtick closing the literal, the `{` of a
   * substitution.
   *
   * @param char - The code of the character.
   * @param previous - The code of the character read before it.
   */
  private _readTemplateText(char: number, previous: number): void {
    switch (char) {
      case BACKSLASH:
        this._escaped = true;
        break;

      case GRAVE_ACCENT:
        this._nesting.pop();
        break;

      case LEFT_BRACE:
        if (previous === DOLLAR) {
          this._nesting.push(LEFT_BRACE);
        }
        break;
    }
  }

  /**
   * Reads a character of code: the start of a literal, a character opening or closing a group.
   *
   * @param char - The code of the character.
   * @param previous - The code of the character read before it.
   */
  private _readCode(char: number, previous: number): void {
    switch (char) {
      case SINGLE_QUOTE:
      case DOUBLE_QUOTE:
        this._quote = char;
        break;

      case GRAVE_ACCENT:
      case LPAREN:
      case LEFT_BRACKET:
      case LEFT_BRACE:
        this._nesting.push(char);
        break;

      case LESS_THAN:
        if (this._types) {
          this._nesting.push(char);
        }
        break;

      default: {
        const opener = OPENERS.get(char);
        const index = opener === undefined || !this._isClosing(char, previous) ? -1 : this._nesting.lastIndexOf(opener);
        if (index !== -1) {
          this._nesting.length = index;
        }
      }
    }
  }

  /**
   * Tells whether a closing character closes a group where it is: `>` only in a type, out of an arrow.
   *
   * @param char - The code of the closing character.
   * @param previous - The code of the character before it.
   * @returns `true` if the character can close a group.
   */
  private _isClosing(char: number, previous: number): boolean {
    return char !== GREATER_THEN || (this._types && previous !== EQUAL_THEN);
  }
}
