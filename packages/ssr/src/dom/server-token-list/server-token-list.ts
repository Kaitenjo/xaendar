import { removeItem } from '@xaendar/common';
import type { AttributeOwner } from '../types/attribute-owner.type';

/**
 * The ASCII whitespace separating the tokens of an attribute.
 */
const ASCII_WHITESPACE = /[\t\n\f\r ]+/;

/**
 * The tokens of an attribute of an element of the server DOM, such as the classes of its `classList`: the members of
 * `DOMTokenList` the runtime uses, which write the attribute as a browser writes it, an ordered set of tokens separated
 * by a space.
 */
export class ServerTokenList {
  /**
   * Creates the token list of an attribute.
   *
   * @param _owner - The element owning the attribute.
   * @param _attribute - The name of the attribute.
   */
  constructor(
    private readonly _owner: AttributeOwner,
    private readonly _attribute: string
  ) { }

  /**
   * The number of tokens.
   *
   * @returns The number of distinct tokens of the attribute.
   */
  public get length(): number {
    return this._read().length;
  }

  /**
   * The value of the attribute, as it is written.
   *
   * @returns The value, an empty string when the element does not have the attribute.
   */
  public get value(): string {
    return this._owner.getAttribute(this._attribute) ?? '';
  }

  /**
   * Tells whether the attribute holds a token.
   *
   * @param token - The token.
   * @returns `true` when the attribute holds it.
   */
  public contains(token: string): boolean {
    return this._read().includes(token);
  }

  /**
   * Adds tokens the attribute does not hold, at its end.
   *
   * @param tokens - The tokens.
   * @throws A `SyntaxError` for an empty token, an `InvalidCharacterError` for a token holding whitespace.
   */
  public add(...tokens: string[]): void {
    validate(tokens);
    const set = this._read();
    for (let i = 0; i < tokens.length; i++) {
      if (!set.includes(tokens[i])) {
        set.push(tokens[i]);
      }
    }

    this._write(set);
  }

  /**
   * Removes tokens from the attribute.
   *
   * @param tokens - The tokens.
   * @throws A `SyntaxError` for an empty token, an `InvalidCharacterError` for a token holding whitespace.
   */
  public remove(...tokens: string[]): void {
    validate(tokens);
    this._write(this._read().filter(token => !tokens.includes(token)));
  }

  /**
   * Removes a token the attribute holds, or adds one it does not hold, as `DOMTokenList.toggle` does: `force` only adds
   * it, or only removes it, and the attribute is not written when nothing changes.
   *
   * @param token - The token.
   * @param force - `true` to only add the token, `false` to only remove it.
   * @returns Whether the attribute holds the token afterwards.
   * @throws A `SyntaxError` for an empty token, an `InvalidCharacterError` for a token holding whitespace.
   */
  public toggle(token: string, force?: boolean): boolean {
    validate([token]);
    const set = this._read();
    if (set.includes(token)) {
      if (force) {
        return true;
      }

      removeItem(set, token)
      this._write(set);
      return false;
    }

    if (force === false) {
      return false;
    }

    set.push(token);
    this._write(set);
    return true;
  }

  /**
   * Returns the value of the attribute.
   *
   * @returns The value, as `value` returns it.
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Reads the distinct tokens of the attribute, in order.
   *
   * @returns The tokens.
   */
  private _read(): string[] {
    const tokens = this.value.split(ASCII_WHITESPACE);
    return tokens.filter((token, index) => token && tokens.indexOf(token) === index);
  }

  /**
   * Writes the tokens into the attribute, separated by a space, unless the element does not have the attribute and
   * there is no token, as the update steps of `DOMTokenList` do.
   *
   * @param tokens - The tokens.
   */
  private _write(tokens: string[]): void {
    if (tokens.length || this._owner.getAttribute(this._attribute) !== null) {
      this._owner.setAttribute(this._attribute, tokens.join(' '));
    }
  }
}

/**
 * Validates tokens as `DOMTokenList` does.
 *
 * @param tokens - The tokens.
 * @throws A `SyntaxError` for an empty token, an `InvalidCharacterError` for a token holding whitespace.
 */
function validate(tokens: string[]): void {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) {
      throw new DOMException('The token must not be empty', 'SyntaxError');
    }

    if (ASCII_WHITESPACE.test(token)) {
      throw new DOMException(`The token "${token}" contains whitespace`, 'InvalidCharacterError');
    }
  }
}
