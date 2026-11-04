import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The total of a cart, computed in its template by a function, an enum and a signal it imports from modules.
 */
@WebComponent({
  selector: 'ex-cart-total',
  templateUrl: './cart-total.xd.component.html'
})
export class CartTotalComponent extends CustomElement {
  /**
   * The price of one item.
   */
  public readonly price = 9.5;
}
