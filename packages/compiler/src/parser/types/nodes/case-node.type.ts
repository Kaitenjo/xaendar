import type { Span } from '../../../types/span.type';
import { ASTNode } from '../ast.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import { ASTNodeType } from '../node.enum';

/**
 * AST node representing a `@case` or `@default` branch inside a `@switch` block.
 */
export type CaseNode = ASTNodeWithSpan<{
  /**
   * Discriminant identifying this node as a case.
   */
  type: ASTNodeType.Case;
  /**
   * The case condition expression, or `null` for a `@default` branch.
   */
  condition: string[] | null; // null = @default
  /**
   * Spans of the case condition expressions, one per condition, empty for a `@default` branch.
   */
  conditionSpans: Span[];
  /**
   * Child nodes rendered when this case matches.
   */
  children: ASTNode[];
}>
