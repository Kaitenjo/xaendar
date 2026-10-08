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
  public readonly rows = computed(() => [
    { query: "Query.content('.item')", found: this.letters(this.first() ? [this.first() as HTMLElement] : []) },
    { query: "Query.content.all('.item')", found: this.letters(this.all()) },
    { query: "… { slots: '' }", found: this.letters(this.inDefault()) },
    { query: "… { slots: 'aside' }", found: this.letters(this.inAside()) },
    { query: '… { lightDom: true }', found: this.letters(this.inLightDom()) }
  ]);

  /**
   * Lists the elements by the first letter of their text.
   *
   * @param elements - The elements.
   * @returns The letters, comma-separated.
   */
  private letters(elements: HTMLElement[]): string {
    return elements.map(element => element.textContent?.charAt(0)).join(', ') || 'nothing';
  }
}
