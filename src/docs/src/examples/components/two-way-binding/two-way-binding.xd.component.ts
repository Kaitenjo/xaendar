import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Binds the same signal to two steppers with [(value)]: a change made by either one is written into the signal, which
 * the other one shows.
 */
@WebComponent({
  selector: 'ex-two-way-binding',
  styleUrl: './two-way-binding.css',
  templateUrl: './two-way-binding.xd.component.html'
})
export class TwoWayBindingComponent extends CustomElement {
  /**
   * The quantity, written by the steppers through their valueChange events and by the reset.
   */
  public readonly quantity = signal(1);

  /**
   * Sets the quantity back to zero: the steppers receive it as any input, and dispatch no event.
   */
  public reset(): void {
    this.quantity.set(0);
  }
}
