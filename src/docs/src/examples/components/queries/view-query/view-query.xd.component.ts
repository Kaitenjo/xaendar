import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';
import { CounterBadgeComponent } from './counter-badge.xd.component';

/**
 * Finds elements of its own template with three queries: by tag, by class of component, and all the matches.
 */
@WebComponent({
  selector: 'ex-view-query',
  templateUrl: './view-query.xd.component.html',
  styleUrl: './view-query.css'
})
export class ViewQueryComponent extends CustomElement {
  /**
   * The text field: the type argument narrows the element found by the selector.
   */
  @Query<HTMLInputElement>('input')
  public accessor field!: QuerySignal<HTMLInputElement | null>;

  /**
   * The badge: queried by its class, it is typed as an instance of the component.
   */
  @Query(CounterBadgeComponent)
  public accessor badge!: QuerySignal<CounterBadgeComponent | null>;

  /**
   * Every row of the list, in document order.
   */
  @Query.all('.row')
  public accessor rows!: QuerySignal<HTMLElement[]>;

  /**
   * The texts of the list.
   */
  public readonly items = signal(['Signals', 'Components']);

  /**
   * What the query sees of the rows.
   */
  public readonly found = computed(() => this.rows().map(row => row.textContent).join(', '));

  /**
   * Focuses the text field and selects its content.
   */
  public focusField(): void {
    this.field()?.focus();
    this.field()?.select();
  }

  /**
   * Adds the text of the field to the list, and lets the badge count it.
   */
  public add(): void {
    const field = this.field();
    const value = field?.value.trim();
    if (field && value) {
      this.items.update(items => [...items, value]);
      this.badge()?.increment();
      field.value = '';
    }
  }
}
