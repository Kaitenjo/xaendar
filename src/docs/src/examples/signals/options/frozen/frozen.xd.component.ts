import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * While `watched`, `unwatched` or `equals` run, signals are frozen: reading or writing one throws.
 */
@WebComponent({
  selector: 'ex-signal-frozen',
  templateUrl: './frozen.xd.component.html',
  styleUrl: './frozen.css'
})
export class SignalFrozenComponent extends CustomElement {
  /**
   * Another signal, touched from inside the callback.
   */
  public readonly other = signal(0);

  /**
   * A signal whose `watched` callback tries to write and read another signal.
   */
  public readonly watchedSignal = signal('value', {
    watched: () => {
      const outcomes: string[] = [];
      try {
        this.other.set(1);
      } catch (error) {
        outcomes.push(`set(): ${(error as Error).message}`);
      }
      try {
        this.other();
      } catch (error) {
        outcomes.push(`get(): ${(error as Error).message}`);
      }
      queueMicrotask(() => this.outcomes.set(outcomes));
    }
  });

  /**
   * What happened inside the callback.
   */
  public readonly outcomes = signal<string[]>([]);

  /**
   * Whether the template depends on `watchedSignal`.
   */
  public readonly visible = signal(false);

  /**
   * Makes the template read `watchedSignal`, which runs its `watched` callback.
   */
  public show(): void {
    this.visible.set(true);
  }
}
