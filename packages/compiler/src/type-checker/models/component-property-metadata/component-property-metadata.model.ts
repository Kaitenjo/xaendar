/**
 * Represents a component property with metadata from @Property decorator.
 */
export class ComponentPropertyMetadata {
  /**
   * The alias of the property, if any.
  */
  public alias?: string;
  /**
   * Indicates whether the property is required.
   */
  public required = false;

  constructor(
    public name: string,
    public type: string,
    public options?: { required?: boolean, alias?: string },
  ) {
    if (options) {
      const { required, alias } = options;
      if (required !== undefined) {
        this.required = required;
      }

      this.alias = alias;
    }
  }
}
