import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * A native form holding a component: the browser reads its value, checks its validity and resets it, as it does for
 * the native fields.
 */
@WebComponent({
  selector: 'ex-rating-form',
  styleUrl: './rating-form.css',
  templateUrl: './rating-form.xd.component.html'
})
export class RatingFormComponent extends CustomElement {
  /**
   * Whether the fieldset is disabled.
   */
  public readonly locked = signal(false);
  /**
   * The entries of the last submission, as `FormData` reads them.
   */
  public readonly sent = signal('');

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
