import { CustomElement, Event, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';

/**
 * Emits a booking whose detail has a key named like an option of CustomEvent.
 */
@WebComponent({
  selector: 'ex-booking-form',
  templateUrl: './booking-form.xd.component.html',
  styleUrl: './booking-form.css'
})
export class BookingFormComponent extends CustomElement {
  /**
   * The booking as the detail itself.
   */
  @Event()
  public accessor booked!: Output<{ date: string; cancelable: boolean }>;

  /**
   * Emits the booking as the detail.
   */
  public book(): void {
    this.booked.emit({ date: '2026-10-08', cancelable: false });
  }
}
