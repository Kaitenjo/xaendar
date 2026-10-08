import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A link to a page of results, whose attributes are bound to signals.
 */
@WebComponent({
  selector: 'ex-attribute-binding',
  templateUrl: './attribute-binding.xd.component.html',
  styleUrl: './attribute-binding.css'
})
export class AttributeBindingComponent extends CustomElement {
  /**
   * The current page.
   */
  public readonly page = signal(1);

  /**
   * The last page.
   */
  public readonly lastPage = 3;

  /**
   * The tooltip of the link.
   */
  public readonly tooltip = computed(() => 'Go to page ' + this.page() + ' of ' + this.lastPage);

  /**
   * The classes of the link.
   */
  public readonly linkClass = computed(() => this.page() === this.lastPage ? 'link link--last' : 'link');

  /**
   * Moves to the next page, then back to the first.
   */
  public next(): void {
    this.page.update(page => page === this.lastPage ? 1 : page + 1);
  }
}
