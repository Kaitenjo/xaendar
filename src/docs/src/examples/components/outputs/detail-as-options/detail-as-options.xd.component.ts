import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Receives the same booking twice: as the detail itself, and wrapped in another object.
 */
@WebComponent({
  selector: 'ex-detail-as-options',
  templateUrl: './detail-as-options.xd.component.html',
  styleUrl: './detail-as-options.css'
})
export class DetailAsOptionsComponent extends CustomElement {
  /**
   * The events received.
   */
  public readonly received = signal<Array<{ id: number; text: string }>>([]);

  /**
   * The identifier of the next line of the log.
   */
  private nextId = 0;

  /**
   * Logs the booked event.
   *
   * @param event - The event, whose detail should be the booking.
   */
  public onBooked(event: CustomEvent<{ date: string; cancelable: boolean }>): void {
    this.record('booked → detail ' + JSON.stringify(event.detail) + ', event.cancelable ' + event.cancelable);
  }

  /**
   * Logs the bookedWrapped event.
   *
   * @param event - The event, whose detail wraps the booking.
   */
  public onBookedWrapped(event: CustomEvent<{ booking: { date: string; cancelable: boolean } }>): void {
    this.record('bookedWrapped → detail ' + JSON.stringify(event.detail));
  }

  /**
   * Adds a line to the log, keeping the last four.
   *
   * @param text - The line.
   */
  private record(text: string): void {
    this.received.update(lines => [...lines, { id: this.nextId++, text }].slice(-4));
  }
}
