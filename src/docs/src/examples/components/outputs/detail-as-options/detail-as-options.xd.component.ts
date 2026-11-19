import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Receives a booking whose detail has a key named like an option of CustomEvent.
 */
@WebComponent({
  selector: 'ex-detail-as-options',
  styleUrl: './detail-as-options.css',
  templateUrl: './detail-as-options.xd.component.html'
})
export class DetailAsOptionsComponent extends CustomElement {
  /**
   * The events received.
   */
  public readonly received = signal<Array<{ id: number; text: string }>>([]);
  /**
   * The identifier of the next line of the log.
   */
  private _nextId = 0;

  /**
   * Logs the booked event.
   *
   * @param event - The event, whose detail should be the booking.
   */
  public onBooked(event: CustomEvent<{ date: string; cancelable: boolean }>): void {
    this._record(`booked → detail ${JSON.stringify(event.detail)}, event.cancelable ${event.cancelable}`);
  }

  /**
   * Adds a line to the log, keeping the last four.
   *
   * @param text - The line.
   */
  private _record(text: string): void {
    this.received.update(lines => [...lines, { id: this._nextId++, text }].slice(-4));
  }
}
