import { html, LitElement, unsafeCSS } from 'lit';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import type { Option } from '../../../shared/data';
import styles from '../../../shared/field.css?inline';

/**
 * A select with its label: its value is a property, and every option the user chooses is a `value-change` event, the
 * binding of Lit being one-way.
 */
export class UiSelect extends LitElement {
  public static override styles = unsafeCSS(styles);
  public static override properties = { label: {}, options: { attribute: false }, value: {} };

  /**
   * The label above the select.
   */
  declare public label: string;
  /**
   * The options.
   */
  declare public options: readonly Option[];
  /**
   * The value of the selected option.
   */
  declare public value: string;

  public constructor() {
    super();
    this.label = '';
    this.options = [];
    this.value = '';
  }

  /*
    `live` compares the value with the one of the native select, which the user changes: a reset writes it again
  */
  protected override render() {
    return html`
      <label class="ui-field">
        <span class="ui-field__label">${this.label}</span>
        <select class="ui-field__control" .value=${live(this.value)} @change=${this._write}>
          ${repeat(this.options, option => option.value, option => html`<option value=${option.value}>${option.label}</option>`)}
        </select>
      </label>
    `;
  }

  /**
   * Takes the option the user chose.
   *
   * @param event - The `change` event of the native select.
   */
  private _write(event: Event): void {
    this.value = (event.target as HTMLSelectElement).value;
    this.dispatchEvent(new CustomEvent('value-change', { detail: this.value }));
  }
}

customElements.define('ui-select', UiSelect);
