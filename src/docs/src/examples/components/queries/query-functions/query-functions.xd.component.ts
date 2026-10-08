import { CustomElement, Query, WebComponent, queryAll } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Binds the number of rows to an attribute four times: only the members the template compiler recognizes as signals
 * keep the attribute up to date.
 */
@WebComponent({
  selector: 'ex-query-functions',
  templateUrl: './query-functions.xd.component.html',
  styleUrl: './query-functions.css'
})
export class QueryFunctionsComponent extends CustomElement {
  /**
   * The items to render.
   */
  public readonly items = signal([1, 2]);

  /**
   * Initialized by a call to queryAll, which does not come from @xaendar/core/signals: not recognized.
   */
  public readonly rows = queryAll(this, '.row');

  /**
   * The same, with a type annotation: with a call as initializer only the called function counts, so still not
   * recognized.
   */
  public readonly typedRows: QuerySignal<HTMLElement[]> = queryAll(this, '.row');

  /**
   * A computed signal reading the query: computed comes from @xaendar/core/signals, so it is recognized.
   */
  public readonly rowCount = computed(() => this.rows().length);

  /**
   * The decorator: an accessor typed with QuerySignal, without initializer, is recognized by its type.
   */
  @Query.all('.row')
  public accessor decoratedRows!: QuerySignal<HTMLElement[]>;

  /**
   * Adds an item, up to five, then starts again from one.
   */
  public add(): void {
    this.items.update(items => items.length < 5 ? [...items, items.length + 1] : [1]);
  }
}
