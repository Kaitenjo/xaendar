import { signal } from '@xaendar/core/signals';

/**
 * The currencies a price can be shown in.
 */
export enum Currency {
  /**
   * Euro.
   */
  Euro = 'EUR',
  /**
   * United States dollar.
   */
  Dollar = 'USD'
}

/**
 * The number of items in the cart, shared by every component reading it.
 */
export const quantity = signal(1);

/**
 * Adds one item to the cart.
 */
export function addItem(): void {
  quantity.update(value => value + 1);
}
