import { html, LitElement, unsafeCSS } from 'lit';
import { live } from 'lit/directives/live.js';
import styles from '../../../shared/field.css?inline';

/**
 * A date field with its label: its value is a property, and every change the user types is a `value-change` event,
 * the binding of Lit being one-way.
 */
export class UiDateInput extends LitElement {
  public static override styles = unsafeCSS(styles);
  public static override properties = { label: {}, value: {} };

  /**
   * The label above the field.
   */
  declare public label: string;
  /**
   * The value of the field.
   */
  declare public value: string;

  public constructor() {
    super();
    this.label = '';
    this.value = '';
  }

  /*
    `live` compares the value with the one of the native field, which the user changes: a reset writes it again
  */
  protected override render() {
    return html`
      <label class="ui-field">
        <span class="ui-field__label">${this.label}</span>
        <input class="ui-field__control" type="date" .value=${live(this.value)} @input=${this._write} />
      </label>
    `;
  }

  /**
   * Takes the value the user typed.
   *
   * @param event - The `input` event of the native field.
   */
  private _write(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('value-change', { detail: this.value }));
  }
}

customElements.define('ui-date-input', UiDateInput);
