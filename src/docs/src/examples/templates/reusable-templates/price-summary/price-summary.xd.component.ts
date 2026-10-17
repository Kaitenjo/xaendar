import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Renders the same line three times, with the label and the amount of each one as arguments.
 */
@WebComponent({
  selector: 'ex-price-summary',
  styleUrl: './price-summary.css',
  templateUrl: './price-summary.xd.component.html'
})
export class PriceSummaryComponent extends CustomElement {
  /**
   * The price of the items in the cart.
   */
  public readonly subtotal = signal(40);
  /**
   * The price of the shipping.
   */
  public readonly shipping = signal(5);

  /**
   * Writes an amount as a price.
   *
   * @param amount - The amount.
   * @returns The price.
   */
  public format(amount: number): string {
    return `€ ${amount.toFixed(2)}`;
  }

  /**
   * Adds an item to the cart: only the amounts reading the subtotal change.
   */
  public add(): void {
    this.subtotal.update(subtotal => subtotal + 10);
  }
}
