import { CustomDirective, Directive, HostListener } from '@xaendar/core';

/**
 * Makes an element submit the form it is in, as a native submit button does: clicking the element submits the form,
 * and so does Enter in a field of the form. For buttons that are not native ones, such as `<ex-button>`, which know
 * nothing about forms.
 */
@Directive({ 
  selector: 'exSubmit' 
})
export class SubmitDirective extends CustomDirective<HTMLElement> {
  /**
   * The form the element is in.
  */
  private _form: HTMLFormElement | null = null;
  
  /**
   * Clicks the element on Enter in a field of the form. Without a native submit button the browser submits a form on
   * Enter only when it has a single field; the event is cancelled, so that it does not, and so that a second element
   * with this directive in the same form does not submit it again.
  *
  * @param event - The key pressed in the form.
  */
  private readonly _submitOnEnter = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.isComposing && !event.defaultPrevented && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      this.element.click();
    }
  };

  /**
   * Submits the form, firing its `submit` event as a native submit button does.
   */
  @HostListener('click')
  public submit(): void {
    this._form?.requestSubmit();
  };

  /**
   * Finds the form and starts listening to the element and to the form.
   */
  public onInit(): void {
    this._form = this.element.closest('form');
    this._form?.addEventListener('keyup', this._submitOnEnter);
  }

  /**
   * Stops listening.
   */
  public onDestroy(): void {
    this._form?.removeEventListener('keyup', this._submitOnEnter);
    this._form = null;
  }
}
