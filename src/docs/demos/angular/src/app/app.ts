import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, ViewEncapsulation, signal } from '@angular/core';

/**
 * Drives the Xaendar element from Angular: a property binding assigns the quantity to its `value` input, and a
 * plain event binding reads the quantity it proposes back.
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
   * The quantity the application holds, which the template shows, assigns to the element and the button raises.
   */
  public readonly quantity = signal(0);

  /**
   * Reads the quantity back from the `changed` event the element dispatches on itself.
   *
   * @param event - The event, whose detail is the new quantity.
   */
  public read(event: Event): void {
    this.quantity.set((event as CustomEvent<number>).detail);
  }

  /**
   * Raises the quantity by five: the property binding assigns it to the element.
   */
  public add(): void {
    this.quantity.update(quantity => quantity + 5);
  }
}
