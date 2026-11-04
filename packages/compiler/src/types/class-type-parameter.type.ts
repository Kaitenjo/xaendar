/**
 * A type parameter of the class of a component or of a directive.
 */
export type ClassTypeParameter = {
  /**
   * The name of the type parameter.
   */
  name: string;
  /**
   * Whether it has a default type (`T = string`), which a template giving it no type gets.
   */
  hasDefault: boolean;
};
