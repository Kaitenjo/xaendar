import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A branch with a text field, kept while the condition stays true and created again when it becomes true again.
 */
@WebComponent({
  selector: 'ex-branch-state',
  templateUrl: './branch-state.xd.component.html',
  styleUrl: './branch-state.css'
})
export class BranchStateComponent extends CustomElement {
  /**
   * How many guests are coming.
   */
  public readonly guests = signal(1);

  /**
   * Changes the number of guests, down to zero.
   *
   * @param delta - The change.
   */
  public change(delta: number): void {
    this.guests.update(guests => Math.max(0, guests + delta));
  }
}
