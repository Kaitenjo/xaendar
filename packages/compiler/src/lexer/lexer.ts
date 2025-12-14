import { EOF, GREATER_THEN, LESS_THAN, MINUS, SLASH, SPACE } from './costants/chars.constants';
import { CurrentChar } from './models/current-char.type';
import { CursorPosition } from './models/current-position.type';
import { TokenType } from './models/token-type.enum';
import { Token } from './models/token.type';
import { isLowerCase, isNewLine, isUpperCase } from './utils/chars.utils';
import { isAllowedCharForTag, isNativeHTMLTag, isReservedTagName } from './utils/tags.utils';

/**
 * Utility class that emulates a cursor navigating through a template string.
 *
 * The cursor keeps track of the current character, its absolute position
 * within the text, and its logical position expressed as row and column.
 * This is useful when parsing or analyzing template content character by character.
 */
export class Lexer {
  /**
   * Unicode code point of the current character.
   * A value of -1 indicates that the cursor is not positioned on a valid character.
   */
  private _currentChar: CurrentChar = { code: 0, index: -1, value: '' };
  /**
   * Zero-based index of the current column within the current row.
   */
  private readonly _cursorPosition = new CursorPosition;

  private readonly _tokens = new Array<Token>;

  /**
   * Creates a new Cursor instance for the given template content.
   *
   * @param templateContent The full template text that the cursor will navigate.
   */
  constructor(public templateContent: string) { }

  public tokenize(): Token[] {
    while (this.nextChar() !== EOF) {
      switch (this._currentChar.code) {
        case LESS_THAN:
          this.startElement();
          break;
        
        case SPACE:
          break;
      }
    }

    return this._tokens;
  }

  /**
   * Read next character in the template string
   * Update internal state of CurrentChar and CursorPosition
   * @returns 
   */
  private nextChar(): number {
    // When attempt to get nextChar but it's already EOF, we only return EOF code
    if (this._currentChar.index === this.templateContent.length) {
      return this._currentChar.code;
    }

    let index = ++this._currentChar.index;
    let code: number;
    let value: string

    if (this._currentChar.index === this.templateContent.length) {
      code = EOF;
      value = '';
    } else {
      code = this.templateContent.charCodeAt(index);
      value = this.templateContent.charAt(index);
    }

    this._currentChar = { code, index, value };

    if (isNewLine(code)) {
      this._cursorPosition.newLine();
    }

    return code;
  }

  private previousChar(): number {
    // When attempt to get previousChar but it's already SOF, we only return the code of the First Character
    if (this._currentChar.index === 0) {
      this._currentChar.code;
    }

    const index = --this._currentChar.index;
    const code = this.templateContent.charCodeAt(index);
    const value = this.templateContent.charAt(index);
    this._currentChar = { code, index, value };

    //TODO: Implement return to previous line
    
    return code;
  }

  private startElement(): void {
    let tagName = '';
    let hasMinus = false

    /*
      CustomElements and Native HTML Elements
      Can only start with Lowercase Letters
    */
    if (isLowerCase(this.nextChar())) {
      tagName = this._currentChar.value;
    } else {
      throw new Error(`${this._currentChar.value} is not valid as first character in HTML Tag`)
    }

    /*
      Keep read input until:
      - Space: <span 
      - GT: <span>
      - Slash (Self Closing tag) <span /
      - EOF 
    */
    while (![SPACE, GREATER_THEN, SLASH, EOF].includes(this.nextChar())) {
      const { value, code } = this._currentChar;
      if (!isAllowedCharForTag(value)) {
        throw new Error(`${value} is not a valid character for HTML Tag`);
      }

      if (isUpperCase(this._currentChar.code)) {
        throw new Error(`${value} is not a valid character for HTML Tag. No UpperCase Characters are allowed`);
      }

      if (!hasMinus && code === MINUS) {
        hasMinus = true;
      }

      tagName = `${tagName}${value}`
    }

    /*
      CustomElements's Names MUST includes a `-` characters
      https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
    */
    if (!hasMinus) {
      if (!isNativeHTMLTag(tagName)) {
        throw new Error(`${tagName} is not recognized as a native HTML Tag`);
      }
    } else if (isReservedTagName(tagName)) {
      throw new Error(`${tagName} is a reserver name and cannot be used as CustomElement Name`)
    }

    
    this._tokens.push({
      type: TokenType.TAG_OPEN_START,
      parts: [tagName]
    });

    this.previousChar();
  }
}

console.log(new Lexer('<span').tokenize());