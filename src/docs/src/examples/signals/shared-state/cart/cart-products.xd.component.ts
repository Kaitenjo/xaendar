import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Lists the products, and adds them to the shared cart.
 */
@WebComponent({
  selector: 'ex-cart-products',
  styleUrl: './cart.css',
  templateUrl: './cart-products.xd.component.html'
})
export class CartProductsComponent extends CustomElement {
  /**
   * The products on sale.
   */
  public readonly products = ['Coffee', 'Tea', 'Cocoa'];
}
