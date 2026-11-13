import type { AttributeOwner } from '../types/attribute-owner.type';

/**
 * The inline style of an element of the server DOM: the members of `CSSStyleDeclaration` the runtime uses, which read and
 * write the `style` attribute as a browser serializes it, the declarations in order, each one `name: value;`, separated
 * by a space.
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
   * @returns The value, an empty string when the attribute does not declare it.
   */
  public getPropertyValue(property: string): string {
    return this._read().get(property) ?? '';
  }

  /**
   * Declares a property, replacing its value when the attribute declares it already, in its place, at the end otherwise.
   * An empty value removes it, as in a browser.
   *
   * @param property - The name of the property.
   * @param value - The value.
   */
  public setProperty(property: string, value: string): void {
    if (!value) {
      this.removeProperty(property);
      return;
    }

    const declarations = this._read();
    declarations.set(property, value);
    this._write(declarations);
  }

  /**
   * Removes a property.
   *
   * @param property - The name of the property.
   * @returns The value it had, an empty string when the attribute did not declare it.
   */
  public removeProperty(property: string): string {
    const declarations = this._read();
    const value = declarations.get(property);
    if (value === undefined) {
      return '';
    }

    declarations.delete(property);
    this._write(declarations);
    return value;
  }

  /**
   * Reads the declarations of the attribute, in order.
   *
   * @returns The values, by name of their property.
   */
  private _read(): Map<string, string> {
    const declarations = new Map<string, string>();
    const parts = (this._owner.getAttribute('style') ?? '').split(';');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const colon = part.indexOf(':');
      if (colon !== -1) {
        declarations.set(part.slice(0, colon).trim(), part.slice(colon + 1).trim());
      }
    }

    return declarations;
  }

  /**
   * Writes the declarations into the attribute, as a browser serializes them.
   *
   * @param declarations - The values, by name of their property.
   */
  private _write(declarations: Map<string, string>): void {
    const parts = new Array<string>();
    for (const [property, value] of declarations) {
      parts.push(`${property}: ${value};`);
    }

    this._owner.setAttribute('style', parts.join(' '));
  }
}
