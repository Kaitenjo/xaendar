import { LitElement, html } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import type { PropertyDeclarations, TemplateResult } from 'lit';
import type { QtyPicker } from '@xaendar-demo/qty-picker';

/**
 * Drives the Xaendar element from Lit: it listens to its event on the tag itself, and sends the quantity back
 * with its method. The quantity is never bound as a property, since the element only takes it through
 * `setValue`.
 *
 * The template renders in the light DOM, so the panel is styled by `demo.css` like the other demos.
 */
export class LitApp extends LitElement {
  /**
   * `quantity` drives the rendering, so Lit watches it as internal state.
   */
  public static override readonly properties: PropertyDeclarations = { quantity: { state: true } };

  /**
   * The quantity the application holds, declared so that it does not shadow the accessor Lit installs.
   */
  public declare quantity: number;

  private readonly _picker = createRef<QtyPicker>();

  /**
   * Starts the application at an empty quantity, the same value the element shows.
   */
  public constructor() {
    super();
    this.quantity = 0;
  }

  /**
   * Keeps the template in the light DOM.
   *
   * @returns The element itself, used as the render root.
   */
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  /**
   * Renders the panel.
   *
   * @returns The template of the panel.
   */
  protected override render(): TemplateResult {
    return html`
      <div class="panel">
        <ex-qty-picker ${ref(this._picker)} @changed=${this._read}></ex-qty-picker>
        <p>Lit state: <strong>${this.quantity}</strong></p>
        <button type="button" @click=${this._add}>+5 from Lit</button>
      </div>
    `;
  }

  /**
   * Reads the quantity the element reports back.
   *
   * @param event - The `changed` event of the element, whose detail is the new quantity.
   */
  private _read(event: CustomEvent<number>): void {
    this.quantity = event.detail;
  }

  /**
   * Adds five to the quantity and pushes it into the element.
   */
  private _add(): void {
    this.quantity += 5;
    this._picker.value?.setValue(this.quantity);
  }
}
