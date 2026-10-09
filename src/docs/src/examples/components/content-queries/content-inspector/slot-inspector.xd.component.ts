import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Runs content queries with different options on its projected content, and lists what each one finds.
 */
@WebComponent({
  selector: 'ex-slot-inspector',
  templateUrl: './slot-inspector.xd.component.html',
  styleUrl: './slot-inspector.css'
})
export class SlotInspectorComponent extends CustomElement {
  /**
   * The first match, in any slot.
   */
  @Query.content('.item')
  public accessor first!: QuerySignal<HTMLElement | null>;
  /**
   * Every match, in any slot.
   */
  @Query.content.all('.item')
  public accessor all!: QuerySignal<HTMLElement[]>;
  /**
   * The matches in the default slot.
   */
  @Query.content.all('.item', { slots: '' })
  public accessor inDefault!: QuerySignal<HTMLElement[]>;
  /**
   * The matches in the aside slot.
   */
  @Query.content.all('.item', { slots: 'aside' })
  public accessor inAside!: QuerySignal<HTMLElement[]>;
  /**
   * The matches in the whole light DOM, assigned to a slot or not.
   */
  @Query.content.all('.item', { lightDom: true })
  public accessor inLightDom!: QuerySignal<HTMLElement[]>;
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
      { query: "Query.content.all('.item')", found: this._letters(this.all()) },
      { query: "… { slots: '' }", found: this._letters(this.inDefault()) },
      { query: "… { slots: 'aside' }", found: this._letters(this.inAside()) },
      { query: '… { lightDom: true }', found: this._letters(this.inLightDom()) }
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
