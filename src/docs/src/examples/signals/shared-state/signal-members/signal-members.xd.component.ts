import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import { level, readLevel } from './level.store';

/**
 * The same shared signal, exposed in three ways. The template compiler decides whether an attribute
 * binding is reactive by looking at the declaration of the members it names, not at their values.
 */
@WebComponent({
  selector: 'ex-signal-members',
  templateUrl: './signal-members.xd.component.html',
  styleUrl: './signal-members.css'
})
export class SignalMembersComponent extends CustomElement {
  /**
   * Recognized: initialized with a module signal, followed by the compiler to its declaration.
   */
  public readonly shared = level;
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
