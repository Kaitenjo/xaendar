import { FASTElement, Observable, html } from '@microsoft/fast-element';
import type { ElementViewTemplate } from '@microsoft/fast-element';

/**
 * Drives the Xaendar element from FAST: `:value` assigns the quantity to its input, and `@changed` reads the
 * quantity it proposes back, on the tag itself.
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
   * Starts the application at an empty quantity, the same value the element shows.
   */
  public constructor() {
    super();
    this.quantity = 0;
  }

  /**
   * Reads the quantity the element proposes.
   *
   * @param quantity - The detail of the `changed` event, i.e. the new quantity.
   */
  public read(quantity: number): void {
    this.quantity = quantity;
  }

  /**
   * Adds five to the quantity: the template assigns it to the element.
   */
  public add(): void {
    this.quantity += 5;
  }
}

Observable.defineProperty(FastApp.prototype, 'quantity');

/**
 * The panel of the application.
 */
const template: ElementViewTemplate<FastApp> = html<FastApp>`
  <div class="panel">
    <ex-qty-picker
      :value="${app => app.quantity}"
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
