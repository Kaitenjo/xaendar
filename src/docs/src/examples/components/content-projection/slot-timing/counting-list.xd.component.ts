import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * A list counting its projected items: in afterRender, and at every slotchange.
 */
@WebComponent({
  selector: 'ex-counting-list',
  templateUrl: './counting-list.xd.component.html',
  styleUrl: './counting-list.css'
})
export class CountingListComponent extends CustomElement {
  /**
   * The slot of the items.
   */
  @Query('slot')
  public accessor slotElement!: QuerySignal<HTMLSlotElement | null>;

  /**
   * What the list saw, step by step.
   */
  public readonly seen = signal<Array<{ id: number; text: string }>>([]);

  /**
   * The identifier of the next line.
   */
  private nextId = 0;

  /**
   * Counts the items right after the render.
   */
  public afterRender(): void {
    this.write('afterRender: ' + this.count() + ' items');
  }

  /**
   * Counts the items when the assigned elements change.
   */
  public onSlotChange(): void {
    this.write('slotchange: ' + this.count() + ' items');
  }

  /**
   * Counts the elements assigned to the slot.
   *
   * @returns The number of elements.
   */
  private count(): number {
    return this.slotElement()?.assignedElements().length ?? 0;
  }

  /**
   * Appends a line.
   *
   * @param text - The line.
   */
  private write(text: string): void {
    this.seen.update(lines => [...lines, { id: this.nextId++, text }]);
  }
}
