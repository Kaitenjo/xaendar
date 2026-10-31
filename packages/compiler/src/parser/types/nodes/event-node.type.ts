import { Expression } from 'typescript';
import { ASTNodeType } from '../node.enum';
import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';

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
   * Span of the event name, without the parentheses (e.g. `click` in `(click)="save()"`).
   */
  nameSpan: Span;
  /**
   * The Event Handler: the method called, as written before its arguments (e.g. `save`, `cart.clear`).
   */
  handler: string;
  /**
   * Span of the handler, as written before its arguments (e.g. `save` in `(click)="save()"`).
   */
  handlerSpan: Span;
  /**
   * The Event Handler parameters
   */
  parameters: Expression[]
}>;
