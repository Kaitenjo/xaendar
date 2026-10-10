import { CustomElement, Property } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * The logic shared by two counters with different templates. It is not a component: it has no decorator and no
 * template, and it is never registered.
 */
export abstract class CounterBase extends CustomElement {
  /**
   * How much each step adds, an input of both components.
   */
  @Property(1)
  public accessor step!: InputSignal<number>;
  /**
   * The count.
   */
  public readonly count = signal(0);
  /**
   * Whether the count is back to zero.
   */
  public readonly atZero = computed(() => this._computeAtZero());

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

  /**
   * Computes the value of `atZero`.
   *
   * @returns Whether the count is back to zero.
   */
  private _computeAtZero(): boolean {
    return this.count() === 0;
  }
}
