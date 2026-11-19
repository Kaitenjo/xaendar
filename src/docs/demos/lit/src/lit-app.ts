import { LitElement, html } from 'lit';
import type { PropertyDeclarations, TemplateResult } from 'lit';

/**
 * Drives the Xaendar element from Lit: `.value` assigns the quantity to its input, and `@changed` reads the
 * quantity it proposes back, on the tag itself.
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
        <ex-qty-picker .value=${this.quantity} @changed=${this._read}></ex-qty-picker>
        <p>Lit state: <strong>${this.quantity}</strong></p>
        <button type="button" @click=${this._add}>+5 from Lit</button>
      </div>
    `;
  }

  /**
   * Reads the quantity the element proposes.
   *
   * @param event - The `changed` event of the element, whose detail is the new quantity.
   */
  private _read(event: CustomEvent<number>): void {
    this.quantity = event.detail;
  }

  /**
   * Adds five to the quantity: the template assigns it to the element.
   */
  private _add(): void {
    this.quantity += 5;
  }
}
