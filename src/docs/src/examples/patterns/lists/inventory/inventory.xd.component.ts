import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { Signal } from '@xaendar/core/signals';

/**
 * A row of the inventory. The quantity is a signal of its own, so changing it updates one cell,
 * without replacing the row.
 */
type Item = {
  /**
   * The identifier of the row, used as the key of the list.
   */
  readonly id: number;
  /**
   * The name of the product.
   */
  readonly name: string;
  /**
   * How many pieces are in stock.
   */
  readonly quantity: Signal<number>;
};

/**
 * An inventory with additions, removals, edits, sorting and filtering.
 */
@WebComponent({
  selector: 'ex-inventory',
  templateUrl: './inventory.xd.component.html',
  styleUrl: './inventory.css'
})
export class InventoryComponent extends CustomElement {
  /**
   * The items, in insertion order.
   */
  public readonly items = signal([this._create('Pens', 12), this._create('Notebooks', 4), this._create('Staplers', 1)]);
  /**
   * The text filtering the items.
   */
  public readonly filter = signal('');
  /**
   * Whether the items are sorted by name.
   */
  public readonly sorted = signal(false);
  /**
   * The items shown: filtered, then sorted when asked.
   */
  public readonly visible = computed(() => this._computeVisible());
  /**
   * The total quantity, recomputed when any quantity changes.
   */
  public readonly total = computed(() => this._computeTotal());
  /**
   * The id of the next item: ids are never reused, so the keys of the list stay unique.
   */
  private _nextId = 1;

  /**
   * Adds the item described by the form, then clears the form.
   *
   * @param event - The submit event.
   */
  public add(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const name = String(new FormData(form).get('name') ?? '').trim();
    if (name) {
      this.items.update(items => [...items, this._create(name, 1)]);
      // reset() restores the initial values of the fields: there is no value attribute to fight with
      form.reset();
    }
  }

  /**
   * Inserts an item at a random position.
   */
  public insertRandom(): void {
    const item = this._create(`Item ${this._nextId}`, 1);
    this.items.update(items => {
      const index = Math.floor(Math.random() * (items.length + 1));
      return [...items.slice(0, index), item, ...items.slice(index)];
    });
  }

  /**
   * Removes an item.
   *
   * @param item - The item.
   */
  public removeItem(item: Item): void {
    this.items.update(items => items.filter(other => other !== item));
  }

  /**
   * Changes the quantity of an item, down to zero.
   *
   * @param item - The item.
   * @param delta - The change.
   */
  public changeQuantity(item: Item, delta: number): void {
    item.quantity.update(quantity => Math.max(0, quantity + delta));
  }

  /**
   * Stores the filter.
   *
   * @param event - The input event of the filter field.
   */
  public setFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  /**
   * Toggles the sorting by name.
   */
  public toggleSort(): void {
    this.sorted.update(sorted => !sorted);
  }

  /**
   * Computes the value of `visible`.
   *
   * @returns The items shown: filtered, then sorted when asked.
   */
  private _computeVisible(): Item[] {
    const filter = this.filter().trim().toLowerCase();
    const shown = this.items().filter(item => item.name.toLowerCase().includes(filter));
    return this.sorted() ? [...shown].sort((left, right) => left.name.localeCompare(right.name)) : shown;
  }

  /**
   * Computes the value of `total`.
   *
   * @returns The total quantity.
   */
  private _computeTotal(): number {
    return this.items().reduce((sum, item) => sum + item.quantity(), 0);
  }

  /**
   * Creates an item.
   *
   * @param name - The name of the item.
   * @param quantity - The initial quantity.
   * @returns The item.
   */
  private _create(name: string, quantity: number): Item {
    return { id: this._nextId++, name, quantity: signal(quantity) };
  }
}
