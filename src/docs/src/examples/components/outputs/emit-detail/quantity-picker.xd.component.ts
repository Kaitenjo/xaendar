import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * Shows a quantity and asks its parent to change it: it never changes the quantity itself.
 */
@WebComponent({
  selector: 'ex-quantity-picker',
  templateUrl: './quantity-picker.xd.component.html',
  styleUrl: './quantity-picker.css'
})
export class QuantityPickerComponent extends CustomElement {
  /**
   * The quantity to show.
   */
  @Property(0)
  public accessor value!: InputSignal<number>;
  /**
   * Asks for a new quantity, carried by the detail of the event.
   */
  @Event()
  public accessor valueChange!: Output<number>;
  /**
   * Tells that the quantity was cleared. An Output without a type argument carries no detail.
   */
  @Event()
  public accessor cleared!: Output;

  /**
   * Asks for the current quantity plus a delta.
   *
   * @param delta - The change.
   */
  public step(delta: number): void {
    this.valueChange.emit(Math.max(0, this.value() + delta));
  }

  /**
   * Asks to clear the quantity.
   */
  public clear(): void {
    this.cleared.emit();
  }
}
