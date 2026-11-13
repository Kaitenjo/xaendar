import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';
import { InterpolationNode } from './interpolation-node.type';

/**
 * AST node representing an HTML attribute on an element.
 */
export type AttributeNode = ASTNodeWithSpan<{
  /**
   * The type of this AST node, which is always `ASTNodeType.Attribute`.
   */
  type: ASTNodeType.Attribute
  /**
   * The attribute name.
   */
  name: string;
  /**
   * Span of the attribute name.
   */
  nameSpan: Span;
  /**
   * The attribute value, either a plain string or an interpolation node.
   */
  value: string | InterpolationNode;
  /**
   * Set when the attribute is declared without a value (`<input disabled>`), which is then `'true'`: that form is
   * only valid for the attributes of a native element, a component or directive property always needs a value.
   */
  bare?: true;
  /**
   * Set on the input a two-way binding binds (`value` of `[(value)]="count"`), whose value is the call of the signal
   * (`count()`): the listener of its event of change is the event node marked the same way.
   */
  twoWay?: true;
}>
