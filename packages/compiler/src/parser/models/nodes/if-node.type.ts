import { ASTNodeType } from '../node.enum.js';
import { ASTNode } from '../ast.type.js';
import { ElseNode } from './else-node.type.js';

/**
 * AST node representing an `@if` conditional directive.
 */
export type IfNode = {
  /**
   * Discriminant identifying this node as an if conditional.
   */
  type: ASTNodeType.If;
  /**
   * The condition expression string.
   */
  condition: string;
  /**
   * Child nodes rendered when the condition is truthy.
   */
  consequent: ASTNode[];
  /**
   * Optional `@else` branch, or `null` if no else clause is present.
   */
  alternate: ElseNode | null;
}
