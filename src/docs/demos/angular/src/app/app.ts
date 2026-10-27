import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ViewEncapsulation, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import type { QtyPicker } from '@xaendar-demo/qty-picker';

/**
 * Drives the Xaendar element from Angular: it listens to its event with a plain event binding, and sends the
 * quantity back with its method, reached through the element ref. The quantity is never bound as a property,
 * because a property binding on the tag would overwrite the signal the element renders from.
 */
@Component({
  selector: 'demo-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.html'
})
export class App {
  /**
   * The quantity the application holds, which the template shows and the button raises.
   */
  public readonly quantity = signal(0);
  /**
   * The Xaendar element, the only way in: it is called, never bound to.
   */
  private readonly _picker = viewChild.required<ElementRef<QtyPicker>>('picker');

  /**
   * Reads the quantity back from the `changed` event the element dispatches on itself.
   *
   * @param event - The event, whose detail is the new quantity.
   */
  public read(event: Event): void {
    this.quantity.set((event as CustomEvent<number>).detail);
  }

  /**
   * Raises the quantity by five and pushes it into the element.
   */
  public add(): void {
    const raised = this.quantity() + 5;
    this.quantity.set(raised);
    this._picker().nativeElement.setValue(raised);
  }
}
