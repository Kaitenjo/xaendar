// counter.xd.component.ts
import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A counter.
 */
@WebComponent({
  selector: 'ex-counter',
  templateUrl: './counter.xd.component.html'
})
export class CounterComponent extends CustomElement {
  /**
   * The current count. Initialized with signal(): the template compiler knows it is a signal.
   */
  public readonly count = signal(0);

  /**
   * Adds one to the count.
   */
  public increment(): void {
    this.count.update(count => count + 1);
  }
}
