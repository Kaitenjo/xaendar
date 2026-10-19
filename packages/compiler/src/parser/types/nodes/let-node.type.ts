import type { Expression } from 'typescript';
import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast.type';
import type { ASTNodeType } from '../node.enum';

/**
 * AST node representing a `@let`, also called a template variable, e.g. `@let total = price() * quantity();`: it names
 * the value of an expression in the expressions of its scope, as a signal when the expression reads one.
 */
export type LetNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a `@let`.
   */
  type: ASTNodeType.Let;
  /**
   * The name the `@let` declares.
   */
  name: string;
  /**
   * Span of the name.
   */
  nameSpan: Span;
  /**
   * The expression of the value.
   */
  value: Expression;
}>
