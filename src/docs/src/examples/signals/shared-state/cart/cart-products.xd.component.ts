import { CustomElement, WebComponent } from '@xaendar/core';
import { add, count } from './cart.store';

/**
 * Lists the products, and adds them to the shared cart.
 */
@WebComponent({
  selector: 'ex-cart-products',
  templateUrl: './cart-products.xd.component.html',
  styleUrl: './cart.css'
})
export class CartProductsComponent extends CustomElement {
  /**
   * The products on sale.
   */
  public readonly products = ['Coffee', 'Tea', 'Cocoa'];
  /**
   * The size of the cart, exposed to the template as a member.
   */
  public readonly count = count;

  /**
   * Adds a product to the cart.
   *
   * @param product - The product.
   */
  public buy(product: string): void {
    add(product);
  }
}
