import { CustomElement, query, queryAll } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';

/**
 * A list querying its own template with the function forms.
 */
export class ListComponent extends CustomElement {
  /**
   * The same as the Query decorator, created in a field.
   */
  public readonly field = query<string, HTMLInputElement>(this, 'input');
  /**
   * The same as Query.all, created in a field.
   */
  public readonly rows = queryAll(this, '.row');
  /**
   * The rows read through a computed signal, as attribute bindings need: see the edge cases.
   */
  public readonly rowCount = computed(() => this._computeRowCount());

  /**
   * Computes the value of `rowCount`.
   *
   * @returns The number of rows.
   */
  private _computeRowCount(): number {
    return this.rows().length;
  }
}
