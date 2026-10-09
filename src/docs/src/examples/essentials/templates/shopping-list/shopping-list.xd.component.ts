import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * An item of the list.
 */
type Item = {
  /**
   * Unique identifier.
   */
  readonly id: number;
  /**
   * What to buy.
   */
  readonly name: string;
  /**
   * Whether it is already in the cart.
   */
  readonly done: boolean;
};

/**
 * A shopping list: interpolation, bindings, events, `@if` and `@for` in one template.
 */
@WebComponent({
  selector: 'ex-shopping-list',
  templateUrl: './shopping-list.xd.component.html',
  styleUrl: './shopping-list.css'
})
export class ShoppingListComponent extends CustomElement {
  /**
   * The items of the list. Items are immutable: changing one replaces it.
   */
  public readonly items = signal<Item[]>([
    { id: 1, name: 'Milk', done: false },
    { id: 2, name: 'Bread', done: true },
    { id: 3, name: 'Coffee', done: false }
  ]);
  /**
   * How many items are still to buy.
   */
  public readonly remaining = computed(() => this._computeRemaining());
  /**
   * The identifier of the next item.
   */
  private _nextId = 4;

  /**
   * Adds the item typed in the form.
   *
   * @param event - The `submit` event of the form.
   */
  public add(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const name = new FormData(form).get('item')?.toString().trim();
    if (name) {
      this.items.update(items => [...items, { id: this._nextId++, name, done: false }]);
    }
    form.reset();
  }

  /**
   * Checks or unchecks an item.
   *
   * @param id - The identifier of the item.
   */
  public toggle(id: number): void {
    this.items.update(items => items.map(item => item.id === id ? { ...item, done: !item.done } : item));
  }

  /**
   * Empties the list.
   */
  public clear(): void {
    this.items.set([]);
  }

  /**
   * Computes the value of `remaining`.
   *
   * @returns How many items are still to buy.
   */
  private _computeRemaining(): number {
    return this.items().filter(item => !item.done).length;
  }
}
