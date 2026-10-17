import type { Span } from '../../../types/span.type';
import { ASTNode, ASTNodeWithSpan } from '../ast.type';
import { ASTNodeType } from '../node.enum';
import { AttributeNode } from './attribute-node.type';
import { ConditionalBindingNode } from './conditional-binding-node.type';
import { DirectiveNode } from './directive-node.type';
import { EventNode } from './event-node.type';
import { StructuralDirectiveNode } from './structural-directive-node.type';
import type { TemplateVariableNode } from './template-variable-node.type';

/**
 * AST node representing an HTML element with a tag name, attributes, events, and children.
 */
export type ElementNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as an element.
   */
  type: ASTNodeType.Element
  /**
   * The HTML tag name of the element.
   */
  tagName: string;
  /**
   * Span of the tag name in the opening tag, e.g. `docs-search` in `<docs-search>`.
   */
  nameSpan: Span;
  /**
   * The type arguments the element declares for the generic class of its web component, e.g. `string` and `number` in `<my-list(string, number)>`.
   */
  typeArguments?: DirectiveNode['typeArguments'];
  /**
   * Span of the tag name in the closing tag, e.g. `docs-search` in `</docs-search>`, `undefined` for a self-closing tag.
   */
  closeNameSpan?: Span;
  /**
   * The template variable naming the element, e.g. `#name` in `<input #name />`, if it declares one.
   */
  variable?: TemplateVariableNode;
  /**
   * Attribute nodes bound to this element.
   */
  attributes: AttributeNode[];
  /**
   * Event binding nodes attached to this element.
   */
  events: EventNode[];
  /**
   * Child AST nodes nested inside this element.
   */
  children: ASTNode[];
  /**
   * Conditional binding nodes attached to this element.
   */
  conditionalBindings: ConditionalBindingNode[];
  /**
   * Directive nodes applied to this element.
   */
  directives: DirectiveNode[];
  /**
   * Structural directive nodes deciding whether this element is rendered.
   */
  structuralDirectives: StructuralDirectiveNode[];
}>
