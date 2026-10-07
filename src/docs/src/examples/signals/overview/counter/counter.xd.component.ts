import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The writable signal API: read, set, update.
 */
@WebComponent({
  selector: 'ex-signal-counter',
  templateUrl: './counter.xd.component.html',
  styleUrl: './counter.css'
})
export class SignalCounterComponent extends CustomElement {
  /**
   * A writable signal, created with its initial value. Its type is inferred: Signal<number>.
   */
  public readonly count = signal(0);

  /**
   * Replaces the value.
   */
  public reset(): void {
    this.count.set(0);
  }

  /**
   * Computes the new value from the previous one.
   */
  public increment(): void {
    this.count.update(count => count + 1);
  }

  /**
   * Reads the value: calling the signal and calling get() are equivalent.
   */
  public double(): void {
    this.count.set(this.count() + this.count.get());
  }
}
