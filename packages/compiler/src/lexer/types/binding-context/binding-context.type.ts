import type { Span } from '../../../types/span.type';

/**
 * Where a binding is being written in the opening tag of an element: the name of an attribute or of an event, bound to
 * the element itself or to one of its directives.
 */
export type BindingContext = {
  /**
   * Whether the name is the one of an attribute (`name="..."`) or of an event (`(name)="..."`).
   */
  readonly kind: 'attribute' | 'event';
  /**
   * The tag name of the element.
   */
  readonly tagName: string;
  /**
   * The selector of the directive or structural directive whose parentheses hold the binding, `undefined` for a
   * binding of the element itself.
   */
  readonly directive: string | undefined;
  /**
   * The span of the part of the name written so far, empty when nothing is written yet.
   */
  readonly span: Span;
};
