import { EOF } from '../costants/chars.constants';
import { isNewLine } from '../utils/chars.utils';
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
   * Read next character in the template string
   * Update internal state of CurrentChar and CursorPosition
   * @returns 
   */
  public advance(): number {
    if (this._currentChar.index >= this.input.length) {
      throw new Error(`Cursor out of Range.\nInput lenght: ${this.input.length}\nIndex: ${this._currentChar.index}`)
    }

    let code: number;
    const index = ++this._currentChar.index;

    if (index === this.input.length) {
      code = EOF;
      this._currentChar.value = '';
    } else {
      code = this.input.charCodeAt(index);
      this._currentChar.value = this.input.charAt(index);
    }

    this._currentChar.code = code;

    if (isNewLine(code)) {
      this._position.row++;
      this._position.column = 0;
    }

    return code;
  }

  /**
   * Read the next character without updating State
   * @returns 
   */
  public peek(): number;
  public peek(chars: number): number[];
  public peek(chars?: number): number | number[] {
    return chars === undefined ? this.peekOne() : this.peekMany(chars);
  }

  private peekOne(): number {
    const nextCharIndex = this._currentChar.index + 1;
    const cache = this._peekCache;
    return cache.has(nextCharIndex) ? cache.get(nextCharIndex)! : this.input.charCodeAt(nextCharIndex);
  }

  peekMany(chars: number): number[] {
    const peekedChars = new Array<number>;
    const cache = this._peekCache;

    const nextCharIndex = this._currentChar.index + 1;
    for (let i = nextCharIndex + 0; i < nextCharIndex + chars; i++) {
      if (cache.has(i)) {
        peekedChars.push(cache.get(i)!);
        continue;
      }

      const charCode = this.input.charCodeAt(i);
      cache.set(i, charCode);
      peekedChars.push(charCode);
    }

    return peekedChars;
  }

  peekMany2(chars: number): number[] {
    const peekedChars = new Array<number>;

    const nextCharIndex = this._currentChar.index + 1;
    for (let i = nextCharIndex + 0; i < nextCharIndex + chars; i++) {
      peekedChars.push(this.input.charCodeAt(i));
    }

    return peekedChars;
  }
}