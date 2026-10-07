import { CustomElement, WebComponent } from '@xaendar/core';
import type { Signal } from '@xaendar/core/signals';
import { clear, lines } from './cart.store';
import type { CartLine } from './cart.store';

/**
 * Shows the shared cart. It knows nothing about the products component: they only share the store.
 */
@WebComponent({
  selector: 'ex-cart-summary',
  templateUrl: './cart-summary.xd.component.html',
  styleUrl: './cart.css'
})
export class CartSummaryComponent extends CustomElement {
  /**
   * The lines of the cart.
   */
  public readonly lines: Signal<CartLine[]> = lines;

  /**
   * Empties the cart.
   */
  public clear(): void {
    clear();
  }
}
