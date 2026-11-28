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
  /**
   * Whether the property is an input of a host directive the component exposes: the element holds it under the name it
   * is exposed with, not under `name`, the one of the property in the directive.
   */
  public exposed = false;
  /**
   * The name of the attribute writing the input, declared by `attribute` of `@Property`: a static value of a template is
   * written into it, and converted by the component as the attribute of any HTML, so it is not type-checked as a string.
   */
  public attribute?: string;

  constructor(
    public name: string,
    public type: string,
    public options?: { required?: boolean, alias?: string, declaration?: MemberDeclaration, exposed?: boolean, attribute?: string },
  ) {
    if (options) {
      const { required, alias, declaration, exposed, attribute } = options;
      if (required !== undefined) {
        this.required = required;
      }
      
      if (exposed !== undefined) {
        this.exposed = exposed;
      }

      this.alias = alias;
      this.declaration = declaration;
      this.attribute = attribute;
    }
  }
}
