import { ServerTokenList } from '../server-token-list/server-token-list';

/**
 * An element of the server DOM: the attributes of an element, in the order they are written, and its classes. What the
 * runtime writes the bindings of an element into, before writing its start tag. Its events are never listened to.
 *
 * It is constructed without arguments, as the constructor of `Element`, and its tag name is assigned right afterwards,
 * as `document.createElement` does in a browser.
 */
export class ServerElement {
  /**
   * The classes of the element, held by its `class` attribute.
   */
  public readonly classList = new ServerTokenList(this, 'class');
  /**
   * The tag name of the element, assigned by the code creating it right after constructing it.
   */
  public localName!: string;
  /**
   * The attributes of the element, by name, in the order they are written.
   */
  private readonly _attributes = new Map<string, string>();

  /**
   * The tag name of the element, uppercase like the one of an element of the HTML namespace.
   *
   * @returns The tag name.
   */
  public get tagName(): string {
    return this.localName.toUpperCase();
  }

  /**
   * Reads an attribute.
   *
   * @param name - The name of the attribute.
   * @returns The value, `null` when the element does not have the attribute.
   */
  public getAttribute(name: string): string | null {
    return this._attributes.get(name) ?? null;
  }

  /**
   * Lists the attributes of the element.
   *
   * @returns The names, in the order the attributes are written.
   */
  public getAttributeNames(): string[] {
    return Array.from(this._attributes.keys());
  }

  /**
   * Tells whether the element has an attribute.
   *
   * @param name - The name of the attribute.
   * @returns `true` when the element has it.
   */
  public hasAttribute(name: string): boolean {
    return this._attributes.has(name);
  }

  /**
   * Writes an attribute, converting its value to a string: a new attribute follows the others, an existing one keeps
   * its place.
   *
   * @param name - The name of the attribute.
   * @param value - The value.
   */
  public setAttribute(name: string, value: string): void {
    this._attributes.set(name, String(value));
  }

  /**
   * Removes an attribute.
   *
   * @param name - The name of the attribute.
   */
  public removeAttribute(name: string): void {
    this._attributes.delete(name);
  }

  /**
   * Removes an attribute the element has, or writes it empty, as `Element.toggleAttribute` does.
   *
   * @param name - The name of the attribute.
   * @param force - `true` to only write it, `false` to only remove it.
   * @returns Whether the element has the attribute afterwards.
   */
  public toggleAttribute(name: string, force?: boolean): boolean {
    const has = force ?? !this.hasAttribute(name);
    if (has && !this.hasAttribute(name)) {
      this.setAttribute(name, '');
    } else if (!has) {
      this.removeAttribute(name);
    }

    return has;
  }

  /**
   * Does nothing: the server listens to no event.
   */
  public addEventListener(): void {
    // The browser listens to the events, once the element is rendered there
  }

  /**
   * Does nothing: the server listens to no event.
   */
  public removeEventListener(): void {
    // The browser listens to the events, once the element is rendered there
  }

  /**
   * Dispatches nothing: the server listens to no event.
   *
   * @returns `true`, as for an event no listener cancels.
   */
  public dispatchEvent(): boolean {
    return true;
  }
}
