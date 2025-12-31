import { PositiveInteger, TupleOfLength } from '@xendar/common';
import { CR, EOF, LF } from '../../costants/chars.constants';
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
  private readonly _position: CursorPosition = { row: 0, column: 0 };

  public get position(): Readonly<CursorPosition> {
    return this._position;
  }

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
      /*
        Before updating the state, we read the current character
        If is a Carriage Return or a Line Feed, the next character
        will be placed in a new line. 
        We need to Reset Column and Increase Row
        
        Otherwise we simply Increase Column
      */
      if ([LF, CR].includes(this._currentChar.code)) {
        this._position.row++;
        this._position.column = 0;
      } else {
        this._position.column++;
      }

      this._currentChar.index = newIndex;
      this._currentChar.value = this.input[newIndex]!;
      this._currentChar.code = this.input.charCodeAt(newIndex);

    }
  }

  /**
   * Read the next character without updating State
   * @returns 
   */
  public peek(): number;
  public peek<OffSet extends number>(options?: { offset?: PositiveInteger<OffSet> }): number;
  public peek(chars: 1): number;
  public peek<OffSet extends number>(chars: 1, options?: { offset?: PositiveInteger<OffSet> }): number; 
  public peek<ReadChars extends number>(chars: PositiveInteger<ReadChars>): TupleOfLength<ReadChars>; 
  public peek<ReadChars extends number, OffSet extends number>(chars: PositiveInteger<ReadChars>, options?: { offset?: PositiveInteger<OffSet> }): TupleOfLength<ReadChars>;
  public peek(charsOrOptions?: number | { offset?: number }, options?: { offset?: number }): number | number[] {
    const cache = this._peekCache;
    const chars = typeof charsOrOptions === 'number' ? charsOrOptions : 1;
    const offset = (typeof charsOrOptions === 'object' ? charsOrOptions : options)?.offset ?? 0;
    return chars === 1 ? this.peekOneChar(this._currentChar.index + offset + 1, cache) : this.peekMany(cache, chars + offset);
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