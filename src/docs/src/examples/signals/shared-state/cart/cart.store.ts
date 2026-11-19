import { computed, signal } from '@xaendar/core/signals';
import type { Computed, Signal } from '@xaendar/core/signals';

/**
 * A line of the cart.
 */
export type CartLine = {
  /**
   * The product.
   */
  readonly product: string;
  /**
   * How many pieces.
   */
  readonly quantity: number;
};

/**
 * The lines of the cart. A module is evaluated once, so every component importing it shares this state.
 */
export const lines: Signal<CartLine[]> = signal<CartLine[]>([]);

/**
 * How many pieces are in the cart.
 */
export const count: Computed<number> = computed(() => lines().reduce((total, line) => total + line.quantity, 0));

/**
 * Adds a piece of a product.
 *
 * @param product - The product.
 */
export function add(product: string): void {
  lines.update(current => current.some(line => line.product === product)
    ? current.map(line => line.product === product ? { ...line, quantity: line.quantity + 1 } : line)
    : [...current, { product, quantity: 1 }]);
}

/**
 * Empties the cart.
 */
export function clear(): void {
  lines.set([]);
}
