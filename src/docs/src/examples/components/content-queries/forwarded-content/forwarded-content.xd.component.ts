import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Projects items into a wrapper, which forwards them to a counter.
 */
@WebComponent({
  selector: 'ex-forwarded-content',
  templateUrl: './forwarded-content.xd.component.html',
  styleUrl: './forwarded-content.css'
})
export class ForwardedContentComponent extends CustomElement {
  /**
   * The items.
   */
  public readonly items = signal(['Milk', 'Bread']);

  /**
   * Adds an item.
   */
  public add(): void {
    this.items.update(items => [...items, `Item ${(items.length + 1)}`]);
  }
}
