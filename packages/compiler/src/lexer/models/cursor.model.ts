import { EOF } from '../costants/chars.constants';
import { CurrentChar } from './current-char.type';
import { CursorPosition } from './current-position.type';

export class Cursor {
  /**
   * Unicode code point of the current character.
   * A value of -1 indicates that the cursor is not positioned on a valid character.
   */
  private readonly _currentChar: CurrentChar = { code: 0, index: -1, value: '' };

  public get currentChar(): Readonly<CurrentChar> {
    return this._currentChar;
  }

  private readonly _peekCache = new Map<number, number>;

  /**
   * Zero-based index of the current column within the current row.
   */
  private readonly _position: CursorPosition = { row: -1, column: -1 };

  constructor(public input: string) { }

  /**
   * Update internal state of CurrentChar and CursorPosition
   * @returns 
   */
  public advance(chars = 1): void {
    if (chars < 1) {
      throw new Error(`${chars} is not a valid value. Please enter a number equal or greater than 1`)
    }

    const newIndex = this._currentChar.index + chars;

    if (newIndex >= this.input.length) {
      this._currentChar.code = EOF;
      this._currentChar.index = -1
      this._currentChar.value = '';
      this.throwEOFError();
    } else {
      this._currentChar.index = newIndex;
      this._currentChar.value = this.input.charAt(newIndex);
      this._currentChar.code = this.input.charCodeAt(newIndex);
    }
  }

  /**
   * Read the next character without updating State
   * @returns 
   */
  public peek(): number;
  public peek(chars: 1): number;
  public peek(chars: number): number[];
  public peek(chars?: number): number | number[] {
    const cache = this._peekCache;
    return chars === undefined || chars === 1 ? this.peekOneChar(this._currentChar.index + 1, cache) : this.peekMany(cache, chars);
  }

  private peekMany(cache: Map<number, number>, chars: number): number[] {
    const peekedChars = new Array<number>;
    const nextCharIndex = this._currentChar.index + 1;

    for (let i = nextCharIndex; i < nextCharIndex + chars; i++) {
      const charCode = this.peekOneChar(i, cache)
      peekedChars.push(charCode);
    }

    return peekedChars;
  }

  private peekOneChar(index: number, cache: Map<number, number>): number {
    if (cache.has(index)) {
      return cache.get(index)!;
    }

    if (index >= this.input.length) {
      this.throwEOFError();
    }

    const charCode = this.input.charCodeAt(index);
    cache.set(index, charCode);
    return charCode
  }

  private throwEOFError(): Error {
    throw new Error('', { cause: EOF })
  }
}