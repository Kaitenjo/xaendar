import { Expression } from 'typescript';
import { ASTNode } from '../ast.type.js';
import { ASTNodeType } from '../node.enum.js';
import { ElseIfNode } from './else-if-node.type.js';
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
   * The parsed condition expression, for use in render code generation.
   */
  conditionNode: Expression
  /**
   * Child nodes rendered when the condition is truthy.
   */
  consequent: ASTNode[];
  /**
   * Optional `@else` branch, or `null` if no else clause is present.
   */
  alternate: ElseIfNode | ElseNode | null;
}
