import type { Span } from '../../../types/span.type';
import { ASTNodeWithSpan } from '../ast.type';
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
}>
