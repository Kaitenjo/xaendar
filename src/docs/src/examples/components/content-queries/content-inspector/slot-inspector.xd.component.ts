import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Runs content queries with different options on the content passed to it, and lists what each one finds.
 */
@WebComponent({
  selector: 'ex-slot-inspector',
  styleUrl: './slot-inspector.css',
  templateUrl: './slot-inspector.xd.component.html'
})
export class SlotInspectorComponent extends CustomElement {
  /**
   * The first match, at any depth.
   */
  @Query.content('.item')
  public accessor first!: QuerySignal<HTMLElement | null>;
  /**
   * The matching children.
   */
  @Query.content.all('.item')
  public accessor childItems!: QuerySignal<HTMLElement[]>;
  /**
   * The matches at any depth.
   */
  @Query.content.all('.item', { descendants: true })
  public accessor all!: QuerySignal<HTMLElement[]>;
  /**
   * The children whose `slot` attribute is `aside`.
   */
  @Query.content.all('[slot="aside"]')
  public accessor inAside!: QuerySignal<HTMLElement[]>;
  /**
   * One row for each query, with the first letter of each element found.
   */
  public readonly rows = computed(() => this._computeRows());

  /**
   * Computes the value of `rows`.
   *
   * @returns One row for each query, with the first letter of each element found.
   */
  private _computeRows(): Array<{ query: string; found: string }> {
    const first = this.first();
    return [
      { query: "Query.content('.item')", found: this._letters(first ? [first] : []) },
      { query: "Query.content.all('.item')", found: this._letters(this.childItems()) },
      { query: '… { descendants: true }', found: this._letters(this.all()) },
      { query: 'Query.content.all(\'[slot="aside"]\')', found: this._letters(this.inAside()) }
    ];
  }

  /**
   * Lists the elements by the first letter of their text.
   *
   * @param elements - The elements.
   * @returns The letters, comma-separated.
   */
  private _letters(elements: HTMLElement[]): string {
    return elements.map(element => element.textContent?.charAt(0)).join(', ') || 'nothing';
  }
}
