import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Moves an element between the slots of a split view by binding its slot attribute.
 */
@WebComponent({
  selector: 'ex-dynamic-slot',
  styleUrl: './dynamic-slot.css',
  templateUrl: './dynamic-slot.xd.component.html'
})
export class DynamicSlotComponent extends CustomElement {
  /**
   * The slot the note is assigned to.
   */
  public readonly side = signal('start');
  /**
   * The sides an element can be assigned to: the last one is not a slot of the split view.
   */
  private readonly _sides = ['start', 'end', 'nowhere'];

  /**
   * Assigns the note to the next side.
   */
  public next(): void {
    const sides = this._sides;
    this.side.update(side => sides[(sides.indexOf(side) + 1) % sides.length] ?? 'start');
  }
}
