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
   * What the list saw, step by step.
   */
  public readonly seen = signal<Array<{ id: number; text: string }>>([]);
  /**
   * The slot of the items.
   */
  @Query('slot')
  public accessor slotElement!: QuerySignal<HTMLSlotElement | null>;
  /**
   * The identifier of the next line.
   */
  private _nextId = 0;

  /**
   * Counts the items right after the render.
   */
  public afterRender(): void {
    this._write(`afterRender: ${this._count()} items`);
  }

  /**
   * Counts the items when the assigned elements change.
   */
  public onSlotChange(): void {
    this._write(`slotchange: ${this._count()} items`);
  }

  /**
   * Counts the elements assigned to the slot.
   *
   * @returns The number of elements.
   */
  private _count(): number {
    return this.slotElement()?.assignedElements().length ?? 0;
  }

  /**
   * Appends a line.
   *
   * @param text - The line.
   */
  private _write(text: string): void {
    this.seen.update(lines => [...lines, { id: this._nextId++, text }]);
  }
}
