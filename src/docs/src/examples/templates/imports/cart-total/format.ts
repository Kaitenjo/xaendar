import type { Currency } from './cart.store';

/**
 * Formats a price in a currency.
 *
 * @param value - The price.
 * @param currency - The currency.
 * @returns The formatted price, e.g. `€9.50`.
 */
export function formatPrice(value: number, currency: Currency): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value);
}
