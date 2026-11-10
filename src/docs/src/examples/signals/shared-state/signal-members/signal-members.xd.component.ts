import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import { level, readLevel } from './level.store';

/**
 * The same shared signal, read in three ways: imported by the template, and through two members. The bindings follow
 * it in all of them, since they track the signals they read while they run.
 */
@WebComponent({
  selector: 'ex-signal-members',
  styleUrl: './signal-members.css',
  templateUrl: './signal-members.xd.component.html'
})
export class SignalMembersComponent extends CustomElement {
  /**
   * The signal, returned by a function of the application.
   */
  public readonly fromHelper = readLevel();
  /**
   * A computed signal reading it.
   */
  public readonly wrapped = computed(() => this._computeWrapped());

  /**
   * Raises the shared level.
   */
  public raise(): void {
    level.update(value => (value + 1) % 11);
  }

  /**
   * Computes the value of `wrapped`.
   *
   * @returns The shared level.
   */
  private _computeWrapped(): number {
    return readLevel()();
  }
}
