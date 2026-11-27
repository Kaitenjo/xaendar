import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';
import { FormFieldDirective } from '@xaendar/forms';
import type { FormError } from '@xaendar/forms';

/**
 * A native form holding a component and a native field: the browser reads their values, checks their validity and
 * resets them. `@@formField` gives both the states and the validators of Angular, and the form shows their errors
 * once the user has left them.
 */
@WebComponent({
  selector: 'ex-rating-form',
  styleUrl: './rating-form.css',
  templateUrl: './rating-form.xd.component.html'
})
export class RatingFormComponent extends CustomElement {
  /**
   * The form control of the rating, as Angular's `#rating="ngModel"`.
   */
  @Query.ref('rating', { read: FormFieldDirective })
  public accessor ratingField!: QuerySignal<FormFieldDirective | null>;
  /**
   * The form control of the comment.
   */
  @Query.ref('comment', { read: FormFieldDirective })
  public accessor commentField!: QuerySignal<FormFieldDirective | null>;
  /**
   * Whether the fieldset is disabled.
   */
  public readonly locked = signal(false);
  /**
   * The entries of the last submission, as `FormData` reads them.
   */
  public readonly sent = signal('');

  /**
   * No error to show, shared.
   */
  private readonly _noErrors: readonly FormError[] = [];

  /**
   * Gives the errors of a field to show: once the user has left it, as Angular's forms show them.
   *
   * @param control - The form control of the field, `null` before the render.
   * @returns Its errors, none while it is untouched.
   */
  public shownErrors(control: FormFieldDirective | null): readonly FormError[] {
    return control && !control.untouched() ? control.errors() : this._noErrors;
  }

  /**
   * Disables or enables the fieldset, as the checkbox says.
   *
   * @param event - The change event of the checkbox.
   */
  public lock(event: Event): void {
    this.locked.set((event.target as HTMLInputElement).checked);
  }

  /**
   * Shows what the form sends, instead of sending it: the browser submits it only when every control is valid.
   *
   * @param event - The submit event.
   */
  public submit(event: SubmitEvent): void {
    event.preventDefault();
    this.sent.set(JSON.stringify(Object.fromEntries(new FormData(event.target as HTMLFormElement))));
  }

  /**
   * Empties the entries shown, along with the form.
   */
  public clear(): void {
    this.sent.set('');
  }
}
