/**
 * An event binding, `(name)="handler($event)"`.
 */
export type LayoutEvent = {
  /**
   * Discriminant identifying the item as an event.
   */
  readonly kind: 'event';
  /**
   * The name of the event.
   */
  readonly name: string;
  /**
   * The handler as written between the quotes.
   */
  readonly value: string;
};
