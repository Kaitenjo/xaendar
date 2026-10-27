import { FASTElement, Observable, html, ref } from '@microsoft/fast-element';
import type { ElementViewTemplate } from '@microsoft/fast-element';
import type { QtyPicker } from '@xaendar-demo/qty-picker';

/**
 * Drives the Xaendar element from FAST: it listens to its event on the tag itself, and sends the quantity back
 * with its method. The quantity is never bound as a property, since the element only takes it through
 * `setValue`.
 *
 * The template renders in the light DOM (`shadowOptions: null`), so the panel is styled by `demo.css` like the
 * other demos.
 */
export class FastApp extends FASTElement {
  /**
   * The quantity the application holds, declared so that it does not shadow the observable accessor.
   */
  public declare quantity: number;

  /**
   * The Xaendar element, assigned by the `ref` directive of the template.
   */
  public declare picker: QtyPicker;

  /**
   * Starts the application at an empty quantity, the same value the element shows.
   */
  public constructor() {
    super();
    this.quantity = 0;
  }

  /**
   * Reads the quantity the element reports back.
   *
   * @param quantity - The detail of the `changed` event, i.e. the new quantity.
   */
  public read(quantity: number): void {
    this.quantity = quantity;
  }

  /**
   * Adds five to the quantity and pushes it into the element.
   */
  public add(): void {
    this.quantity += 5;
    this.picker.setValue(this.quantity);
  }
}

Observable.defineProperty(FastApp.prototype, 'quantity');

/**
 * The panel of the application.
 */
const template: ElementViewTemplate<FastApp> = html<FastApp>`
  <div class="panel">
    <ex-qty-picker
      ${ref<FastApp>('picker')}
      @changed="${(app, context) => app.read(context.eventDetail<number>())}"
    ></ex-qty-picker>
    <p>FAST state: <strong>${app => app.quantity}</strong></p>
    <button type="button" @click="${app => app.add()}">+5 from FAST</button>
  </div>
`;

/**
 * Defines `<fast-app>`, in the light DOM so that the panel keeps the styles of the page.
 */
export function defineFastApp(): void {
  FASTElement.define(FastApp, { name: 'fast-app', shadowOptions: null, template });
}
