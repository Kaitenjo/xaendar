import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import { level, readLevel } from './level.store';

/**
 * The same shared signal, read in three ways: imported by the template, and through two members. The template
 * compiler decides whether an attribute binding is reactive by looking at the declaration of what it names, not
 * at its value.
 */
@WebComponent({
  selector: 'ex-signal-members',
  styleUrl: './signal-members.css',
  templateUrl: './signal-members.xd.component.html'
})
export class SignalMembersComponent extends CustomElement {
  /**
   * Not recognized: initialized by calling a function of the application, even if it returns a signal.
   */
  public readonly fromHelper = readLevel();
  /**
   * Recognized: initialized by calling computed().
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
