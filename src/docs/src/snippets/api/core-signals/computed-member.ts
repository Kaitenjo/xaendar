import { CustomElement } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A cart, whose total follows its items.
 */
export class CartComponent extends CustomElement {
  /**
   * The items in the cart.
   */
  public readonly items = signal<Array<{ name: string; price: number }>>([]);
  /**
   * The total price, derived from the items.
   */
  public readonly total = computed(() => this._computeTotal());

  /**
   * Adds an item. The total is not computed now, but at its next read.
   *
   * @param name - The name of the item.
   * @param price - Its price.
   */
  public add(name: string, price: number): void {
    this.items.update(items => [...items, { name, price }]);
  }

  /**
   * Computes the value of `total`.
   *
   * @returns The sum of the prices.
   */
  private _computeTotal(): number {
    return this.items().reduce((sum, item) => sum + item.price, 0);
  }
}
