import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Shows the shared cart. It knows nothing about the products component: they only share the store.
 */
@WebComponent({
  selector: 'ex-cart-summary',
  styleUrl: './cart.css',
  templateUrl: './cart-summary.xd.component.html'
})
export class CartSummaryComponent extends CustomElement {}
