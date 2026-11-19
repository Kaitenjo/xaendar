import { Expression } from 'typescript';
import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';
import { CaseNode } from './case-node.type';

/**
 * AST node representing an `@switch` directive with one or more case branches.
 */
export type SwitchNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a switch.
   */
  type: ASTNodeType.Switch;
  /**
   * The switch expression string.
   */
  expression: Expression;
  /**
   * The list of `@case` and `@default` branches.
   */
  children: CaseNode[];
  /**
   * The span of `@default never;`, when the `@switch` ends with it: it declares no branch, so nothing is rendered for
   * it, and the type-check requires the `@case` branches to cover every value of the expression.
   */
  exhaustive?: Span;
}>
