import { CustomElement } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * The logic shared by two counters with different templates. It is not a component: it has no decorator and no
 * template, and it is never registered.
 */
export abstract class CounterBase extends CustomElement {
  /**
   * How much each step adds. Abstract: every component declares it with its own decorator, so that the template
   * compiler sees it. Typed as a plain function: typed as an InputSignal, it would be a signal member of the base
   * class too, and the components redeclaring it would not compile.
   */
  public abstract accessor step: () => number;

  /**
   * The count.
   */
  public readonly count = signal(0);

  /**
   * Whether the count is back to zero.
   */
  public readonly atZero = computed(() => this.count() === 0);

  /**
   * Adds one step.
   */
  public increment(): void {
    this.count.update(count => count + this.step());
  }

  /**
   * Removes one step, down to zero.
   */
  public decrement(): void {
    this.count.update(count => Math.max(0, count - this.step()));
  }

  /**
   * Goes back to zero.
   */
  public reset(): void {
    this.count.set(0);
  }
}
