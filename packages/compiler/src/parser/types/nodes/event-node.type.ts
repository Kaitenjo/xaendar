import { Expression } from 'typescript';
import { ASTNodeType } from '../node.enum';
import type { Span } from '../../../types/span.type';
import type { ASTNodeWithSpan } from '../ast-node-with-span.type';
import type { CastNode } from './cast-node.type';

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
  /**
   * The types the parameters are cast to, by the index of the parameter, e.g. `MouseEvent` for `0` in
   * `(click)="select($event as MouseEvent)"`: only the ones of the parameters cast, if any.
   */
  casts?: Map<number, CastNode>;
  /**
   * Set on the listener a two-way binding binds (`valueChange` of `[(value)]="count"`), calling `set` of the signal
   * with the detail of the event (`count.set($event.detail)`): its name has the span of the name of the input, the
   * attribute node marked the same way.
   */
  twoWay?: true;
}>;
