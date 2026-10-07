import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * `watched` and `unwatched` run when a signal gains its first dependent and loses its last one:
 * here they start and stop the timer feeding the signal.
 */
@WebComponent({
  selector: 'ex-signal-watched',
  templateUrl: './watched.xd.component.html',
  styleUrl: './watched.css'
})
export class SignalWatchedComponent extends CustomElement {
  /**
   * The current time, refreshed every second only while something depends on it.
   */
  public readonly now = signal(new Date().toLocaleTimeString(), {
    watched: () => {
      this.timer = setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
      this.count('watched');
    },
    unwatched: () => {
      clearInterval(this.timer);
      this.count('unwatched');
    }
  });

  /**
   * Whether the clock is displayed, which is what makes the template depend on `now`.
   */
  public readonly visible = signal(false);

  /**
   * How many times each callback ran.
   */
  public readonly calls = signal({ watched: 0, unwatched: 0 });

  /**
   * The timer feeding `now`.
   */
  private timer: ReturnType<typeof setInterval> | undefined;

  /**
   * Shows or hides the clock.
   */
  public toggle(): void {
    this.visible.update(visible => !visible);
  }

  /**
   * Stops the timer if the component leaves the page while the clock is displayed.
   */
  public onDestroy(): void {
    clearInterval(this.timer);
  }

  /**
   * Counts a call. Signals cannot be written while the callbacks run, so the write is deferred.
   *
   * @param callback - The callback that ran.
   */
  private count(callback: 'watched' | 'unwatched'): void {
    queueMicrotask(() => this.calls.update(calls => ({ ...calls, [callback]: calls[callback] + 1 })));
  }
}
