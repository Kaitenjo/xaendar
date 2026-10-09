import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * An effect runs once synchronously, then once per microtask in which its dependencies changed.
 */
@WebComponent({
  selector: 'ex-effect-batching',
  templateUrl: './batching.xd.component.html',
  styleUrl: './batching.css'
})
export class EffectBatchingComponent extends CustomElement {
  /**
   * First dependency.
   */
  public readonly first = signal(0);
  /**
   * Second dependency.
   */
  public readonly second = signal(0);
  /**
   * The runs of the effect, most recent first.
   */
  public readonly runs = signal<Array<{ id: number; text: string }>>([]);

  /**
   * Starts the effect: its first run happens right here, synchronously.
   */
  public onInit(): void {
    this.effect(() => {
      const text = `saw first = ${this.first()}, second = ${this.second()}`;
      // update() does not track `runs`: the effect only depends on first and second
      this.runs.update(runs => [{ id: runs.length + 1, text }, ...runs]);
    });
  }

  /**
   * One change: one run.
   */
  public changeFirst(): void {
    this.first.update(value => value + 1);
  }

  /**
   * Three synchronous changes: still one run, which sees the final values.
   */
  public changeThreeTimes(): void {
    this.first.update(value => value + 1);
    this.second.update(value => value + 1);
    this.first.update(value => value + 1);
  }

  /**
   * A change that is reverted before the microtask: the effect still runs, and sees the same values.
   */
  public changeAndRevert(): void {
    this.first.update(value => value + 1);
    this.first.update(value => value - 1);
  }
}
