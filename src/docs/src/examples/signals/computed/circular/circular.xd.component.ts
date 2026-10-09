import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { Computed } from '@xaendar/core/signals';

/**
 * Two computed signals reading each other form a cycle: reading either of them throws.
 */
@WebComponent({
  selector: 'ex-computed-circular',
  templateUrl: './circular.xd.component.html',
  styleUrl: './circular.css'
})
export class ComputedCircularComponent extends CustomElement {
  /**
   * The outcome of the last read.
   */
  public readonly outcome = signal('Not read yet');

  /**
   * Builds a cycle and reads it.
   */
  public readCycle(): void {
    // first and second read each other: the callbacks only run when first is read, once both exist
    const first: Computed<number> = computed(() => second() + 1);
    const second: Computed<number> = computed(() => first() + 1);
    try {
      this.outcome.set(`Value: ${first()}`);
    } catch (error) {
      this.outcome.set(`Error: ${(error as Error).message}`);
    }
  }
}
