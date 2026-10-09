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
  public readonly tooltip = computed(() => this._computeTooltip());
  /**
   * The classes of the link.
   */
  public readonly linkClass = computed(() => this._computeLinkClass());

  /**
   * Moves to the next page, then back to the first.
   */
  public next(): void {
    this.page.update(page => page === this.lastPage ? 1 : page + 1);
  }

  /**
   * Computes the value of `tooltip`.
   *
   * @returns The tooltip of the link.
   */
  private _computeTooltip(): string {
    return `Go to page ${this.page()} of ${this.lastPage}`;
  }

  /**
   * Computes the value of `linkClass`.
   *
   * @returns The classes of the link.
   */
  private _computeLinkClass(): string {
    return this.page() === this.lastPage ? 'link link--last' : 'link';
  }
}
