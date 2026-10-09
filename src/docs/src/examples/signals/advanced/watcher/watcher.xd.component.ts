import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A minimal effect built by hand on top of the TC39 primitives: a Computed doing the work,
 * a Watcher scheduling it. This is, in essence, what effect() does.
 */
@WebComponent({
  selector: 'ex-signal-watcher',
  templateUrl: './watcher.xd.component.html',
  styleUrl: './watcher.css'
})
export class SignalWatcherComponent extends CustomElement {
  /**
   * What happened, in order.
   */
  public readonly log = signal<Array<{ id: number; text: string }>>([]);
  /**
   * A raw State: the Signal.subtle API only accepts the TC39 objects, not the functions returned by signal().
   */
  private readonly _count = new Signal.State(0);
  /**
   * The watcher, once created.
   */
  private _watcher: Signal.subtle.Watcher | undefined;

  /**
   * Builds the effect and runs it once.
   */
  public start(): void {
    if (this._watcher) {
      return;
    }

    const work = new Signal.Computed(() => {
      const value = this._count.get();
      this._write(`computed ran with count = ${value}`);
    });

    this._watcher = new Signal.subtle.Watcher(() => {
      // Runs synchronously inside count.set(), with every signal frozen: it can only schedule work
      this._write('notify: scheduling a microtask');
      queueMicrotask(() => {
        for (const pending of this._watcher!.getPending()) {
          pending.get();
        }
        // A Watcher notifies once, then waits: watch() re-arms it
        this._watcher!.watch();
      });
    });

    this._watcher.watch(work);
    work.get();
  }

  /**
   * Changes the State twice in a row: one notification, one run.
   */
  public incrementTwice(): void {
    this._count.set(this._count.get() + 1);
    this._count.set(this._count.get() + 1);
  }

  /**
   * Logs a line. Signals are frozen inside notify(), so every write is deferred.
   *
   * @param text - The line.
   */
  private _write(text: string): void {
    queueMicrotask(() => this.log.update(log => [...log, { id: log.length, text }]));
  }

  /**
   * Stops watching when the component leaves the page.
   */
  public onDestroy(): void {
    this._watcher?.unwatch(...Signal.subtle.introspectSources(this._watcher));
  }
}
