import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The sides an element can be assigned to: the last one is not a slot of the split view.
 */
const SIDES = ['start', 'end', 'nowhere'];

/**
 * Moves an element between the slots of a split view by binding its slot attribute.
 */
@WebComponent({
  selector: 'ex-dynamic-slot',
  templateUrl: './dynamic-slot.xd.component.html',
  styleUrl: './dynamic-slot.css'
})
export class DynamicSlotComponent extends CustomElement {
  /**
   * The slot the note is assigned to.
   */
  public readonly side = signal('start');

  /**
   * Assigns the note to the next side.
   */
  public next(): void {
    this.side.update(side => SIDES[(SIDES.indexOf(side) + 1) % SIDES.length] ?? 'start');
  }
}
