import type { Mutable } from '@xaendar/types';

/**
 * The totals of a cart, read-only for the code reading them.
 */
type Totals = {
  /**
   * The number of items.
   */
  readonly items: number;
  /**
   * The price of all the items.
   */
  readonly price: number;
};

/**
 * Sums the lines of a cart.
 *
 * @param lines - The lines of the cart.
 * @returns The totals, read-only.
 */
function sum(lines: readonly CartLine[]): Totals {
  const totals: Mutable<Totals> = { items: 0, price: 0 };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    totals.items += line.quantity; // ✓ writable while it is built
    totals.price += line.quantity * line.price;
  }
  return totals;
}

sum(cart.lines).items = 0; // ✗ Cannot assign to 'items' because it is a read-only property.
