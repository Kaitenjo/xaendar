/**
 * Represents a component property with metadata from @Property decorator.
 */
export class ComponentPropertyMetadata {
  /**
   * The alias of the property, if any.
  */
  public alias?: string;
  /**
   * The default value for the property, if any.
   */
  public defaultValue?: unknown;
  /**
   * Indicates whether the property is required.
   */
  public required = false;

  constructor(
    public name: string,
    public type: string,
    public options?: { required?: boolean, alias?: string, defaultValue?: unknown },
  ) {
    if (options) {
      const { required, alias, defaultValue } = options;
      if (required !== undefined) {
        this.required = required;
        if (!required && defaultValue !== undefined) {
          this.defaultValue = defaultValue;
        }
      }

      this.alias = alias;
    }
  }

  /**
   * Gets the default value for the property, considering whether it is required.
   * @param required Whether to consider the property as required when getting the default value.
   */
  public getDefaultValue(): unknown;
  public getDefaultValue(required: true): unknown;
  public getDefaultValue(required: false): undefined;
  public getDefaultValue(required?: boolean): unknown {
    return !(required && this.required) ? this.defaultValue : undefined;
  }

  /**
   * Sets the default value for the property.
   * @param value The default value to set for the property.
   * @throws Throws an error if the property is required.
   */
  public setDefaultValue(value: unknown) {
    if (this.required) {
      throw new Error(`Cannot set default value for required property "${this.name}".`);
    }

    this.defaultValue = value;
  }
}
