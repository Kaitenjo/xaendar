import { parseStyleDeclarations, stylePriority, styleValue } from '@xaendar/common';
import type { AttributeOwner } from '../types/attribute-owner.type';

/**
 * The inline style of an element of the server DOM: the members of `CSSStyleDeclaration` the runtime uses, which read and
 * write the `style` attribute as a browser serializes it, the declarations in order, each one `name: value;`, followed by
 * `!important` for a property set with that priority, separated by a space. The attribute is read as the runtime parses
 * a `style` string (see `parseStyleDeclarations`), so a `;` inside parentheses or quotes stays in its value.
 */
export class ServerStyleDeclaration {
  /**
   * Creates the inline style of an element.
   *
   * @param _owner - The element owning the `style` attribute.
   */
  constructor(private readonly _owner: AttributeOwner) { }

  /**
   * The number of the declarations.
   *
   * @returns The number of the properties the attribute declares.
   */
  public get length(): number {
    return this._read().size;
  }

  /**
   * Reads the value of a property.
   *
   * @param property - The name of the property.
   * @returns The value, without its priority, an empty string when the attribute does not declare it.
   */
  public getPropertyValue(property: string): string {
    const value = this._read().get(property);
    return value === undefined ? '' : styleValue(value);
  }

  /**
   * Reads the priority of a property.
   *
   * @param property - The name of the property.
   * @returns `'important'` for a property declared with `!important`, an empty string otherwise.
   */
  public getPropertyPriority(property: string): string {
    const value = this._read().get(property);
    return value === undefined ? '' : stylePriority(value);
  }

  /**
   * Sets a property, keeping its place when the attribute declares it already, or removes it for an empty value.
   *
   * @param property - The name of the property.
   * @param value - The value.
   * @param priority - `'important'` to declare it with `!important`.
   */
  public setProperty(property: string, value: string, priority = ''): void {
    if (!value) {
      this.removeProperty(property);
      return;
    }

    const declarations = this._read();
    declarations.set(property, priority === 'important' ? `${value} !important` : value);
    this._write(declarations);
  }

  /**
   * Removes a property.
   *
   * @param property - The name of the property.
   * @returns The value it had, without its priority, an empty string when the attribute did not declare it.
   */
  public removeProperty(property: string): string {
    const declarations = this._read();
    const value = declarations.get(property);
    if (value === undefined) {
      return '';
    }

    declarations.delete(property);
    this._write(declarations);
    return styleValue(value);
  }

  /**
   * Reads the declarations of the `style` attribute.
   *
   * @returns The value of each property, with ` !important` for its priority.
   */
  private _read(): Map<string, string> {
    const declarations = new Map<string, string>();
    const parsed = parseStyleDeclarations(this._owner.getAttribute('style') ?? '');
    if (parsed?.length) {
      for (let i = 0; i < parsed.length; i += 2) {
        declarations.set(parsed[i], parsed[i + 1]);
      }
    }

    return declarations;
  }

  /**
   * Writes the `style` attribute from its declarations.
   *
   * @param declarations - The value of each property, with ` !important` for its priority.
   */
  private _write(declarations: Map<string, string>): void {
    const parts = new Array<string>();
    for (const [property, value] of declarations) {
      parts.push(`${property}: ${value};`);
    }

    this._owner.setAttribute('style', parts.join(' '));
  }
}
