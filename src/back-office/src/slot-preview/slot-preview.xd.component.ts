import { CustomElement, Property, Query, WebComponent } from '@xaendar/core';
import type { InputSignal, QuerySignal } from '@xaendar/core/signals';

/**
 * Projects its content into a header, a default and a footer slot, and shows what the
 * `@Query.content` and `@Query.content.all` decorators find in it.
 */
@WebComponent({
  selector: 'app-slot-preview',
  styleUrl: './slot-preview.component.css',
  templateUrl: './slot-preview.xd.component.html',
})
export class SlotPreviewComponent extends CustomElement {
  /**
   * The name of the last slot, after the default one.
   */
  @Property('footer')
  public accessor footerSlot!: InputSignal<string>;

  @Query.content('[item]')
  public accessor first!: QuerySignal<HTMLElement | null>;

  @Query.content.all('[item]')
  public accessor all!: QuerySignal<HTMLElement[]>;

  @Query.content.all('[item]', { slots: 'header' })
  public accessor header!: QuerySignal<HTMLElement[]>;

  @Query.content.all('[item]', { slots: ['header', 'footer'] })
  public accessor edges!: QuerySignal<HTMLElement[]>;

  @Query.content.all('[item]', { lightDom: true })
  public accessor lightDom!: QuerySignal<HTMLElement[]>;

  public readonly labels = {
    first: '@Query.content(\'[item]\')',
    all: '@Query.content.all(\'[item]\')',
    header: '@Query.content.all(\'[item]\', { slots: \'header\' })',
    edges: '@Query.content.all(\'[item]\', { slots: [\'header\', \'footer\'] })',
    lightDom: '@Query.content.all(\'[item]\', { lightDom: true })'
  };

  /**
   * Describes the result of a query of a single element.
   *
   * @param element - The element found by the query, or `null`.
   * @returns The text of the element, or `null`.
   */
  public describe(element: Element | null): string {
    return element ? element.textContent.trim() : 'null';
  }

  /**
   * Describes the result of a query of all the matching elements.
   *
   * @param elements - The elements found by the query.
   * @returns The texts of the elements, in order.
   */
  public describeAll(elements: Element[]): string {
    return `[${elements.map(element => this.describe(element)).join(', ')}]`;
  }
}
