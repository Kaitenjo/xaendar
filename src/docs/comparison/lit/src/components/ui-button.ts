import { html, LitElement, unsafeCSS } from 'lit';
import styles from '../../../shared/button.css?inline';

/**
 * The button of the page: its content is projected, its click is the native one.
 */
export class UiButton extends LitElement {
  public static override styles = unsafeCSS(styles);
  public static override properties = { variant: {} };

  /**
   * `primary` or `secondary`.
   */
  declare public variant: 'primary' | 'secondary';

  public constructor() {
    super();
    this.variant = 'secondary';
  }

  protected override render() {
    return html`<button class="ui-button ui-button--${this.variant}" type="button"><slot></slot></button>`;
  }
}

customElements.define('ui-button', UiButton);
