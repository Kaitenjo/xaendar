import { isValidCustomElementName } from '@xaendar/common';

/**
 * The `customElements` of the server DOM: the tag names the classes of the components are defined with, as a browser
 * holds them.
 *
 * A class named like the one defined with a tag name replaces it: it is the same component, defined again by its module
 * evaluated again, as the server rendering of the development server does when the module changes.
 */
export class ServerCustomElementRegistry {
  /**
   * The class defined with each tag name.
   */
  private readonly _classes = new Map<string, CustomElementConstructor>();
  /**
   * The tag name each class is defined with.
   */
  private readonly _names = new Map<CustomElementConstructor, string>();
  /**
   * The promises of `whenDefined` waiting for a tag name, with the functions resolving them.
   */
  private readonly _waiting = new Map<string, PromiseWithResolvers<CustomElementConstructor>>();

  /**
   * Defines a class with a tag name.
   *
   * @param name - The tag name.
   * @param constructor - The class.
   * @throws A `SyntaxError` for an invalid custom element name, a `NotSupportedError` when the name is already defined
   *   with a class named otherwise, or the class with another name.
   */
  public define(name: string, constructor: CustomElementConstructor): void {
    if (!isValidCustomElementName(name, false)) {
      throw new DOMException(`"${name}" is not a valid custom element name`, 'SyntaxError');
    }

    const defined = this._classes.get(name);
    if (defined && defined.name !== constructor.name) {
      throw new DOMException(`The name "${name}" has already been used with this registry`, 'NotSupportedError');
    }

    if (this._names.has(constructor)) {
      throw new DOMException(`${constructor.name} has already been used with this registry`, 'NotSupportedError');
    }

    /*
      Reached by a class named like the defined one but not the same object, which is rejected above: the development
      server evaluates the module of a component again when it changes, creating a new class, which takes the tag name
    */
    if (defined) {
      this._names.delete(defined);
    }

    this._classes.set(name, constructor);
    this._names.set(constructor, name);
    this._waiting.get(name)?.resolve(constructor);
    this._waiting.delete(name);
  }

  /**
   * Returns the class defined with a tag name.
   *
   * @param name - The tag name.
   * @returns The class, `undefined` when none is defined with the name.
   */
  public get(name: string): CustomElementConstructor | undefined {
    return this._classes.get(name);
  }

  /**
   * Returns the tag name a class is defined with.
   *
   * @param constructor - The class.
   * @returns The tag name, `null` when the class is not defined.
   */
  public getName(constructor: CustomElementConstructor): string | null {
    return this._names.get(constructor) ?? null;
  }

  /**
   * Waits until a class is defined with a tag name.
   *
   * @param name - The tag name.
   * @returns A promise resolving to the class.
   */
  public whenDefined(name: string): Promise<CustomElementConstructor> {
    const defined = this._classes.get(name);
    if (defined) {
      return Promise.resolve(defined);
    }

    let waiting = this._waiting.get(name);
    if (!waiting) {
      waiting = Promise.withResolvers<CustomElementConstructor>();
      this._waiting.set(name, waiting);
    }

    return waiting.promise;
  }
}
