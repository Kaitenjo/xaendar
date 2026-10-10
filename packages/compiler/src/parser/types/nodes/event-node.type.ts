import { Expression } from 'typescript';
import { ASTNodeType } from '../node.enum';
import { ASTNodeWithSpan } from '../ast.type';

/**
 * AST node representing a DOM event binding on an element.
 */
export type EventNode = ASTNodeWithSpan<{

  type: ASTNodeType.Event;
  /**
   * The DOM Event Name (e.g. `click`, `input`).
   */
  name: string;
  /**
   * The Event Handler: the method called, as written before its arguments (e.g. `save`, `cart.clear`).
   */
  handler: string;
  /**
   * The Event Handler parameters
   */
  parameters: Expression[]
}>;
