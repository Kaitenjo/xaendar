import { CustomElement, Event, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { Output } from '@xaendar/core';

/**
 * The Xaendar component every demo application of this page embeds. It is written for a foreign host: it owns
 * its quantity instead of taking it as an input, is changed from outside through a public method, and reports
 * each change with an event on its own element.
 */
@WebComponent({
  selector: 'ex-qty-picker',
  styleUrl: './qty-picker.css',
  templateUrl: './qty-picker.xd.component.html'
})
export class QtyPickerComponent extends CustomElement {
  /**
   * Tells the host the quantity changed, carried by the detail of the event.
   */
  @Event()
  public accessor changed!: Output<number>;
  /**
   * The quantity shown. It is a plain signal, not an input: a host that is not Xaendar cannot set an input.
   */
  public readonly value = signal(0);

  /**
   * Sets the quantity from outside. A public method of the class is a method of the element: this is how an
   * application written in another framework sends data in.
   *
   * @param value - The new quantity, never negative.
   */
  public setValue(value: number): void {
    this.value.set(Math.max(0, value));
  }

  /**
   * Changes the quantity by a delta and tells the host.
   *
   * @param delta - The change.
   */
  public step(delta: number): void {
    this.setValue(this.value() + delta);
    this.changed.emit(this.value());
  }
}
