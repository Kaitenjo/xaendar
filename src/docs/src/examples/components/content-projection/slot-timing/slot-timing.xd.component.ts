import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Adds and removes a list whose items are projected, and shows what the list sees of them.
 */
@WebComponent({
  selector: 'ex-slot-timing',
  templateUrl: './slot-timing.xd.component.html',
  styleUrl: './slot-timing.css'
})
export class SlotTimingComponent extends CustomElement {
  /**
   * Whether the list is in the page.
   */
  public readonly shown = signal(false);
  /**
   * The projected items.
   */
  public readonly items = signal(['Apples', 'Pears']);

  /**
   * Adds or removes the list.
   */
  public toggle(): void {
    this.shown.update(shown => !shown);
  }

  /**
   * Projects one more item.
   */
  public add(): void {
    this.items.update(items => [...items, `Item ${(items.length + 1)}`]);
  }
}
