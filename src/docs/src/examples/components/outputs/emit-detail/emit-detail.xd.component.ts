import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Owns a quantity and passes it down to a picker, which asks for changes with events.
 */
@WebComponent({
  selector: 'ex-emit-detail',
  templateUrl: './emit-detail.xd.component.html',
  styleUrl: './emit-detail.css'
})
export class EmitDetailComponent extends CustomElement {
  /**
   * The quantity. This component owns it: the picker only shows it.
   */
  public readonly quantity = signal(2);

  /**
   * The highest quantity this component accepts.
   */
  public readonly limit = 5;

  /**
   * The events received, latest first.
   */
  public readonly received = signal<Array<{ id: number; text: string }>>([]);

  /**
   * The identifier of the next line of the log.
   */
  private nextId = 0;

  /**
   * Accepts the quantity asked by the picker, within the limit.
   *
   * @param event - The valueChange event: the asked quantity is its detail.
   */
  public setQuantity(event: CustomEvent<number>): void {
    this.record('valueChange, detail ' + event.detail);
    if (event.detail <= this.limit) {
      this.quantity.set(event.detail);
    }
  }

  /**
   * Resets the quantity. The cleared event carries no detail, so the template has no $event to pass.
   */
  public clear(): void {
    this.record('cleared, no detail');
    this.quantity.set(0);
  }

  /**
   * Adds a line to the log, keeping the last five.
   *
   * @param text - The line.
   */
  private record(text: string): void {
    this.received.update(lines => [{ id: this.nextId++, text }, ...lines].slice(0, 5));
  }
}
