import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A counter. Clicking updates two text nodes, and nothing else: no re-render, no diffing.
 */
@WebComponent({
  selector: 'ex-home-counter',
  templateUrl: './counter.xd.component.html',
  styleUrl: './counter.css'
})
export class CounterComponent extends CustomElement {
  /**
   * How many times the button was clicked.
   */
  public readonly count = signal(0);

  /**
   * Derived from `count`, recomputed only when it changes.
   */
  public readonly double = computed(() => this.count() * 2);

  /**
   * Counts a click.
   */
  public increment(): void {
    this.count.update(count => count + 1);
  }
}
