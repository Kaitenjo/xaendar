import { CustomElement, Event, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * The Xaendar component every demo application of this page embeds. It is written for a foreign host and is
 * controlled: it shows the quantity the host assigns to its `value` property, and a click does not change it but
 * proposes the new one with an event on its own element, which the host keeps in its state and assigns back.
 */
@WebComponent({
  selector: 'ex-qty-picker',
  styleUrl: './qty-picker.css',
  templateUrl: './qty-picker.xd.component.html'
})
export class QtyPickerComponent extends CustomElement {
  /**
   * Proposes a new quantity to the host, carried by the detail of the event.
   */
  @Event()
  public accessor changed!: Output<number>;
  /**
   * The quantity shown. A host that is not Xaendar sets it by assigning the property of the element, which is what
   * the property bindings of the frameworks do.
   */
  @Property(0)
  public accessor value!: InputSignal<number>;

  /**
   * Proposes the quantity changed by a delta, never negative.
   *
   * @param delta - The change.
   */
  public step(delta: number): void {
    this.changed.emit(Math.max(0, this.value() + delta));
  }
}
