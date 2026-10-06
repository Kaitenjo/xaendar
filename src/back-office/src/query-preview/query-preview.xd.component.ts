import { CustomElement, Property, Query, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { InputSignal, QuerySignal } from '@xaendar/core/signals';
import { BindingPreviewComponent } from '../binding-preview/binding-preview.xd.component';

/**
 * Renders a list of items in its Shadow DOM, and shows what the `@Query` and `@Query.all` decorators find in it.
 */
@WebComponent({
  selector: 'app-query-preview',
  styleUrl: './query-preview.component.css',
  templateUrl: './query-preview.xd.component.html',
})
export class QueryPreviewComponent extends CustomElement {
  /**
   * How many items are rendered.
   */
  @Property(3)
  public accessor count!: InputSignal<number>;

  /**
   * Whether the items are rendered in reverse order.
   */
  @Property(false)
  public accessor reversed!: InputSignal<boolean>;

  /**
   * Whether an `app-binding-preview` is rendered after the items.
   */
  @Property(false)
  public accessor nested!: InputSignal<boolean>;

  @Query('[item]')
  public accessor first!: QuerySignal<HTMLElement | null>;

  @Query.all('[item]')
  public accessor all!: QuerySignal<HTMLElement[]>;

  @Query(BindingPreviewComponent)
  public accessor preview!: QuerySignal<BindingPreviewComponent | null>;

  public readonly labels = {
    first: '@Query(\'[item]\')',
    all: '@Query.all(\'[item]\')',
    preview: '@Query(BindingPreviewComponent)'
  };

  public readonly items = computed(() => {
    const items = Array.from({ length: Math.max(this.count(), 0) }, (_, i) => i + 1);
    return this.reversed() ? items.reverse() : items;
  });

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

  /**
   * Describes the result of a query of a web component.
   *
   * @param element - The component found by the query, or `null`.
   * @returns The tag of the component, or `null`.
   */
  public describeTag(element: Element | null): string {
    return element ? `<${element.localName}>` : 'null';
  }
}
