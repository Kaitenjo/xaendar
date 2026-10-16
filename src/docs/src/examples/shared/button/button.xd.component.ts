import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The button of the live examples, styled like the buttons of the home page. The host itself is the button: it takes
 * the role, the focus and the keyboard activation of a native one, so `(click)`, `aria-label`, `title` and `disabled`
 * go directly on `<ex-button>`. It knows nothing about forms: `@@exSubmit` makes it submit the one it is in.
 * `variant="primary"` fills it with the gradient of the main actions.
 */
@WebComponent({
  selector: 'ex-button',
  styleUrl: './button.css',
  templateUrl: './button.xd.component.html'
})
export class ButtonComponent extends CustomElement {
  /**
   * The attributes whose changes reach `attributeChangedCallback`.
   */
  public static readonly observedAttributes = ['disabled'];
  /**
   * Exposes the host to assistive technologies as a button.
   */
  private readonly _internals = this.attachInternals();

  /**
   * Gives the host the role of a button and listens to the clicks and to the keys that activate it.
   */
  public constructor() {
    super();
    this._internals.role = 'button';
    this.addEventListener('click', event => this._stopWhenDisabled(event));
    this.addEventListener('keydown', event => this._press(event));
  }

  /**
   * Makes the host focusable, unless it is disabled.
   */
  public onInit(): void {
    this._updateDisabled();
  }

  /**
   * Follows the `disabled` attribute.
   */
  public attributeChangedCallback(): void {
    this._updateDisabled();
  }

  /**
   * Removes a disabled button from the focus order and tells assistive technologies about it.
   */
  private _updateDisabled(): void {
    const disabled = this.hasAttribute('disabled');
    this.tabIndex = disabled ? -1 : 0;
    this._internals.ariaDisabled = String(disabled);
  }

  /**
   * Stops the clicks on a disabled button before the listeners of the parent and of its directives, which are added
   * after this one.
   *
   * @param event - The click.
   */
  private _stopWhenDisabled(event: MouseEvent): void {
    if (this.hasAttribute('disabled')) {
      event.stopImmediatePropagation();
    }
  }

  /**
   * Clicks the button on Enter and Space, as a native button does.
   *
   * @param event - The key pressed while the button has the focus.
   */
  private _press(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.click();
    }
  }
}
