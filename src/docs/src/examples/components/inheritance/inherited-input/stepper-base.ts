import { CustomElement, Property } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A base class declaring its input itself, with the decorator.
 */
export abstract class StepperBase extends CustomElement {
  /**
   * How much each step adds. Declared here, the template compiler does not see it in the templates using the
   * components that inherit it.
   */
  @Property(1)
  public accessor step!: InputSignal<number>;
  /**
   * The count.
   */
  public readonly count = signal(0);

  /**
   * Adds one step.
   */
  public increment(): void {
    this.count.update(count => count + this.step());
  }
}
