import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Counts the list items projected into it, wherever they come from.
 */
@WebComponent({
  selector: 'ex-item-counter',
  templateUrl: './item-counter.xd.component.html',
  styleUrl: './item-counter.css'
})
export class ItemCounterComponent extends CustomElement {
  /**
   * The projected items, with the slots forwarded to this component flattened.
   */
  @Query.content.all('li')
  public accessor items!: QuerySignal<HTMLElement[]>;
  /**
   * The texts of the items found.
   */
  public readonly texts = computed(() => this._computeTexts());

  /**
   * Computes the value of `texts`.
   *
   * @returns The texts of the items found.
   */
  private _computeTexts(): string {
    return this.items().map(item => item.textContent).join(', ');
  }
}
