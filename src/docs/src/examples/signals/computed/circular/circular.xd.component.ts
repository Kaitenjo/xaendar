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
    // a and b read each other: the callbacks only run when a is read, once both exist
    const a: Computed<number> = computed(() => b() + 1);
    const b: Computed<number> = computed(() => a() + 1);
    try {
      this.outcome.set(`Value: ${a()}`);
    } catch (error) {
      this.outcome.set(`Error: ${(error as Error).message}`);
    }
  }
}
