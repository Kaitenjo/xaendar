import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * Interpolates signals, a computed signal, a method and a few expressions: every one of them follows the signals it
 * reads.
 */
@WebComponent({
  selector: 'ex-interpolation-basics',
  templateUrl: './interpolation-basics.xd.component.html',
  styleUrl: './interpolation-basics.css'
})
export class InterpolationBasicsComponent extends CustomElement {
  /**
   * The name of the product.
   */
  public readonly product = signal('notebook');

  /**
   * How many pieces are in the cart.
   */
  public readonly quantity = signal(1);

  /**
   * The price of one piece.
   */
  public readonly price = 4.5;

  /**
   * The total, as a computed signal.
   */
  public readonly total = computed(() => this.quantity() * this.price);

  /**
   * The total, formatted by a method. Text interpolations are reactive even when they call a method that reads
   * signals.
   *
   * @returns The total with its currency.
   */
  public formattedTotal(): string {
    return this.total().toFixed(2) + ' €';
  }

  /**
   * Adds a piece.
   */
  public add(): void {
    this.quantity.update(quantity => quantity + 1);
  }

  /**
   * Switches the product.
   */
  public switchProduct(): void {
    this.product.update(product => product === 'notebook' ? 'pencil' : 'notebook');
  }
}
