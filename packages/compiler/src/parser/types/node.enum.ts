/**
 * Discriminant values that identify the type of each AST node produced by the parser.
 */
export enum ASTNodeType {
  /**
   * An HTML element node with a tag name, attributes, events, and children.
   */
  Element,
  /**
   * An attribute node representing a key-value pair on an HTML element.
   */
  Attribute,
  /**
   * An event binding node attached to an HTML element.
   */
  Event,
  /**
   * A plain text node.
   */
  Text,
  /**
   * An inline interpolation expression or literal.
   */
  Interpolation,
  /**
   * An `@if` conditional node.
   */
  If,
  /**
   * An `@else` branch node attached to an `@if`.
   */
  Else,
  /**
   * An `@else if` branch node attached to an `@if`.
   */
  ElseIf,
  /**
   * An `@for` iteration node.
   */
  For,
  /**
   * An `@switch` node containing one or more case nodes.
   */
  Switch,
  /**
   * A `@case` or `@default` branch inside a `@switch`.
   */
  Case,
  /**
   * An import statement node, typically used to import modules or components.
   */
  Import,
  /**
   * A dynamic binding node representing a conditionally evaluated expression or content.
   */
  DynamicBinding
}