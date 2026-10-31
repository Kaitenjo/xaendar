import type { MemberDeclaration } from '../../../types/member-declaration.type';

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
  /**
   * Where the `@Property` accessor is declared: in the class itself, or in one of its base classes.
   */
  public declaration?: MemberDeclaration;

  constructor(
    public name: string,
    public type: string,
    public options?: { required?: boolean, alias?: string, declaration?: MemberDeclaration },
  ) {
    if (options) {
      const { required, alias, declaration } = options;
      if (required !== undefined) {
        this.required = required;
      }

      this.alias = alias;
      this.declaration = declaration;
    }
  }
}
