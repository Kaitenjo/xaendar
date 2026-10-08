import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The same list rendered twice, tracked by identifier and by index, with a field in every row.
 */
@WebComponent({
  selector: 'ex-keyed-state',
  templateUrl: './keyed-state.xd.component.html',
  styleUrl: './keyed-state.css'
})
export class KeyedStateComponent extends CustomElement {
  /**
   * The people.
   */
  public readonly people = signal([{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }, { id: 3, name: 'Linus' }]);

  /**
   * Moves the last person to the top.
   */
  public rotate(): void {
    this.people.update(people => [...people.slice(-1), ...people.slice(0, -1)]);
  }
}
